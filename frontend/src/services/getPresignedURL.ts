import axios from "axios";

export async function getPresignedURL(file: File) {
  const { data } = await axios.post<{ signedUrl: string }>(
    'https://xxxxxxx.lambda-url.us-east-1.on.aws', // URL da sua lambda aqui!
    { fileName: file.name },
  );

  return data.signedUrl;
}
