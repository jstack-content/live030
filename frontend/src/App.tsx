import { Loader2Icon, PackageOpenIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'sonner';
import { Button } from './components/Button';
import { Progress } from './components/Progress';
import { cn } from './lib/utils';
import { getPresignedURL } from './services/getPresignedURL';
import { uploadFile } from './services/uploadFile';

interface IUpload {
  file: File;
  progress: number;
}

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploads, setUploads] = useState<IUpload[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setUploads(prevState => prevState.concat(
        acceptedFiles.map(file => ({ file, progress: 0 }))
      ));
    },
  });

  function handleRemoveUpload(removingIndex: number) {
    setUploads(prevState => {
      const newState = [...prevState];
      newState.splice(removingIndex, 1);

      return newState;
    });
  }

  async function handleUpload() {
    try {
      setIsLoading(true);

      const uploadObjects = await Promise.all(uploads.map(async ({ file }) => ({
        file,
        url: await getPresignedURL(file),
      })));

      const response = await Promise.allSettled(uploadObjects.map(({ file, url }, index) => (
        uploadFile(url, file, (progress) => {
          setUploads(prevState => {
            const newState = [...prevState];
            const upload = newState[index];

            newState[index] = {
              ...upload,
              progress,
            };

            return newState;
          });
        })
      )));

      response.forEach((response, index) => {
        if (response.status === 'rejected') {
          const fileWithError = uploads[index].file;
          console.log(`O upload do arquivo ${fileWithError.name} falhou.`)
        }
      });

      setUploads([]);
      toast.success('Uploads realizados com sucesso!');
    } catch {} finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center py-20 px-6">
      <Toaster />

      <div className="w-full max-w-xl">
        <div
          {...getRootProps()}
          className={cn(
            'border h-60 w-full rounded-md border-dashed transition-colors flex items-center justify-center flex-col cursor-pointer',
            isDragActive && 'bg-accent/50',
          )}
        >
          <input {...getInputProps()} />

          <PackageOpenIcon className="size-10 stroke-1 mb-2" />

          <span>
            Solte os seus arquivos aqui
          </span>
          <small className="text-muted-foreground">
            Apenas arquivos PNG de até 1MB
          </small>
        </div>

        {uploads.length > 0 && (
          <div className="mt-10">
            <h2 className="font-medium text-2xl tracking-tight">
              Arquivos selecionados
            </h2>

            <div className="mt-4 space-y-2">
              {uploads.map(({ file, progress }, index) => (
                <div
                  key={file.name}
                  className="border p-3 rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {file.name}
                    </span>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveUpload(index)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>

                  <Progress
                    className="h-2 mt-3"
                    value={progress}
                  />
                </div>
              ))}
            </div>

            <Button
              className="mt-4 w-full gap-1"
              onClick={handleUpload}
              disabled={isLoading}
            >
              {isLoading && <Loader2Icon className="size-4 animate-spin"  />}
              Upload
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
