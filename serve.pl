#!/usr/bin/env perl
# Robust single-file static HTTP server (no external deps)
use strict;
use warnings;
use IO::Socket::INET;
use IO::Select;
use File::Basename qw(dirname);
use Cwd qw(abs_path);

my $port = $ARGV[0] // 8765;
my $root = abs_path(dirname(__FILE__));
$root =~ s{/\z}{};

my %types = (
  html => 'text/html; charset=utf-8',
  css  => 'text/css; charset=utf-8',
  js   => 'application/javascript; charset=utf-8',
  svg  => 'image/svg+xml',
  png  => 'image/png',
  jpg  => 'image/jpeg',
  jpeg => 'image/jpeg',
  ico  => 'image/x-icon',
  json => 'application/json',
  txt  => 'text/plain; charset=utf-8',
  map  => 'application/json',
  woff => 'font/woff',
  woff2=> 'font/woff2',
);

my $server = IO::Socket::INET->new(
  LocalAddr => '0.0.0.0',
  LocalPort => $port,
  Proto     => 'tcp',
  ReuseAddr => 1,
  Listen    => 64,
) or die "Cannot bind :$port — $!\n";
$server->blocking(0);

STDOUT->autoflush(1);
print "LUMEN demo serving $root\n";
print "Open in browser:\n";
print "  http://127.0.0.1:$port/\n";
print "  http://localhost:$port/\n";
print "Press Ctrl+C to stop.\n";

my $sel = IO::Select->new($server);

while (1) {
  my @ready = $sel->can_read(1.0);
  next unless @ready;

  for my $fh (@ready) {
    if ($fh == $server) {
      while (my $client = $server->accept()) {
        $client->autoflush(1);
        $client->blocking(0);
        eval { handle_client($client) };
        if ($@) {
          warn "handler error: $@";
        }
        close $client;
      }
    }
  }
}

sub handle_client {
  my ($client) = @_;
  my $raw = read_http_request($client, 5.0);
  return unless defined $raw && length $raw;

  my ($head) = split /\r?\n\r?\n/, $raw, 2;
  $head //= $raw;
  my @lines = split /\r?\n/, $head;
  my $req = shift @lines // '';
  my ($method, $path) = $req =~ m{^(\S+)\s+(\S+)};
  $method //= 'GET';
  $path   //= '/';
  $path =~ s/\?.*//;

  if ($method ne 'GET' && $method ne 'HEAD') {
    send_response($client, 405, 'text/plain; charset=utf-8', "Method Not Allowed\n", 0);
    return;
  }

  # URL-decode minimal + block traversal
  $path =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
  $path =~ s#\\#/#g;
  if ($path =~ /\.\./ || $path =~ m{^//} ) {
    send_response($client, 403, 'text/plain; charset=utf-8', "Forbidden\n", 0);
    return;
  }

  $path = '/' if $path eq '';
  my $rel = $path;
  $rel =~ s{^/}{};
  $rel = 'index.html' if $rel eq '' || $rel =~ m{/\z};

  my $file = "$root/$rel";
  if (-d $file) {
    $file =~ s{/\z}{};
    $file .= '/index.html';
  }

  # Resolve and ensure under root
  my $abs = eval { abs_path($file) };
  if (!$abs || index($abs, $root) != 0 || !-f $abs || !-r $abs) {
    send_response($client, 404, 'text/plain; charset=utf-8', "404 Not Found: $path\n", 0);
    return;
  }

  open my $fh, '<:raw', $abs or do {
    send_response($client, 500, 'text/plain; charset=utf-8', "Server Error\n", 0);
    return;
  };
  local $/;
  my $body = <$fh>;
  close $fh;
  $body = '' unless defined $body;

  my ($ext) = $abs =~ /\.([^.]+)\z/;
  $ext = lc($ext // 'txt');
  my $ctype = $types{$ext} // 'application/octet-stream';

  send_response($client, 200, $ctype, $body, $method eq 'HEAD');
  print "[", scalar localtime, "] $method $path -> 200 (", length($body), " bytes)\n";
}

sub read_http_request {
  my ($client, $timeout) = @_;
  my $buf = '';
  my $deadline = time + $timeout;
  my $csel = IO::Select->new($client);

  while (time <= $deadline) {
    my $remain = $deadline - time;
    $remain = 0.05 if $remain < 0.05;
    my @r = $csel->can_read($remain > 1 ? 1 : $remain);
    next unless @r;

    my $chunk = '';
    my $n = sysread($client, $chunk, 8192);
    if (!defined $n) {
      # non-blocking: try again until timeout
      next;
    }
    return if $n == 0 && $buf eq '';
    $buf .= $chunk;

    # headers complete?
    if ($buf =~ /\r?\n\r?\n/) {
      my ($headers) = split /\r?\n\r?\n/, $buf, 2;
      my $cl = 0;
      if ($headers =~ /Content-Length:\s*(\d+)/i) {
        $cl = $1;
      }
      my $body_start = length($headers);
      # account for separator
      if ($buf =~ /\r\n\r\n/) {
        $body_start += 4;
      } else {
        $body_start += 2;
      }
      my $have = length($buf) - $body_start;
      return $buf if $have >= $cl;
    }

    return $buf if length($buf) > 1_000_000;
  }
  return length($buf) ? $buf : undef;
}

sub send_response {
  my ($client, $code, $ctype, $body, $head_only) = @_;
  my %status = (
    200 => 'OK',
    403 => 'Forbidden',
    404 => 'Not Found',
    405 => 'Method Not Allowed',
    500 => 'Internal Server Error',
  );
  my $msg = $status{$code} // 'OK';
  my $len = length($body // '');
  my $out = join("\r\n",
    "HTTP/1.1 $code $msg",
    "Content-Type: $ctype",
    "Content-Length: $len",
    "Connection: close",
    "Cache-Control: no-cache",
    "Access-Control-Allow-Origin: *",
    "",
    $head_only ? "" : ($body // ""),
  );
  # ensure final body is appended correctly (join adds trailing empty which is fine for head)
  if (!$head_only) {
    $out = "HTTP/1.1 $code $msg\r\n"
         . "Content-Type: $ctype\r\n"
         . "Content-Length: $len\r\n"
         . "Connection: close\r\n"
         . "Cache-Control: no-cache\r\n"
         . "Access-Control-Allow-Origin: *\r\n"
         . "\r\n"
         . ($body // "");
  } else {
    $out = "HTTP/1.1 $code $msg\r\n"
         . "Content-Type: $ctype\r\n"
         . "Content-Length: $len\r\n"
         . "Connection: close\r\n"
         . "Cache-Control: no-cache\r\n"
         . "\r\n";
  }

  my $offset = 0;
  my $total = length($out);
  my $wsel = IO::Select->new($client);
  my $deadline = time + 5;
  while ($offset < $total && time <= $deadline) {
    if ($wsel->can_write(1)) {
      my $n = syswrite($client, $out, $total - $offset, $offset);
      last unless defined $n;
      $offset += $n;
    }
  }
}
