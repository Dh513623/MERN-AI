import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let loaded = false;

export const convertToWav = async (audioBlob) => {
  try {
    if (!loaded) {
      await ffmpeg.load();
      loaded = true;
    }

    await ffmpeg.writeFile('input.webm', await fetchFile(audioBlob));

    await ffmpeg.exec(['-i', 'input.webm', 'output.wav']);

    const data = await ffmpeg.readFile('output.wav');

    return new Blob([data.buffer], { type: 'audio/wav' });

  } catch (err) {
    console.error(err);
    return audioBlob;
  }
};