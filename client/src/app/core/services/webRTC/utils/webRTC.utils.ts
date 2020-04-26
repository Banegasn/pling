export function setMediaBitrate(sdp: string, media: string, bitrate: number) {
  const lines = sdp.split('\n');
  let line = -1;
  // tslint:disable-next-line: no-bitwise
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('m=' + media) === 0) {
      line = i;
      break;
    }
  }
  if (line === -1) {
    console.log('Could not find the m line for', media);
    return sdp;
  }

  // Pass the m line
  line++;

  // Skip i and c lines
  while (lines[line].indexOf('i=') === 0 || lines[line].indexOf('c=') === 0) {
    line++;
  }

  // If we're on a b line, replace it
  if (lines[line].indexOf('b') === 0) {
    lines[line] = 'b=AS:' + bitrate;
    return lines.join('\n');
  }

  // Add a new b line
  let newLines = lines.slice(0, line);
  newLines.push('b=AS:' + bitrate);
  newLines = newLines.concat(lines.slice(line, lines.length));
  return newLines.join('\n');
}
