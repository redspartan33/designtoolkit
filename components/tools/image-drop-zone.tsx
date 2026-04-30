'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageDropZoneProps {
  onImageSelected: (file: File, objectUrl: string) => void;
  disabled?: boolean;
  className?: string;
  hint?: string;
}

/**
 * Componente reutilizable para carga de imágenes.
 * Soporta: clic para seleccionar, arrastrar y soltar (drag & drop), y pegar del portapapeles (Cmd+V).
 */
export function ImageDropZone({ onImageSelected, disabled, className, hint }: ImageDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    const url = URL.createObjectURL(file);
    onImageSelected(file, url);
  }, [onImageSelected]);

  // --- Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // --- File input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  // --- Clipboard paste (Cmd+V / Ctrl+V) ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            toast.success('Imagen pegada desde el portapapeles.');
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, processFile]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border-2 border-dashed transition-all duration-200',
        isDragging
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : 'border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/50',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn(
        'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors',
        isDragging ? 'bg-primary/20' : 'bg-primary/10'
      )}>
        <Upload className={cn('w-8 h-8 transition-colors', isDragging ? 'text-primary' : 'text-primary/70')} />
      </div>

      <h3 className="text-base font-semibold mb-1">
        {isDragging ? 'Suelta la imagen aquí' : 'Sube una imagen'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-3">
        {hint ?? 'Arrastra un archivo, haz clic para seleccionarlo, o pega desde el portapapeles.'}
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border border-dashed border-muted-foreground/20 rounded-md px-3 py-1.5">
        <Clipboard className="w-3 h-3" />
        <span>Cmd+V para pegar del portapapeles</span>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
