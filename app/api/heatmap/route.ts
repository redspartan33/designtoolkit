import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Configurar la URL de tu microservicio FastAPI local
    // Asumimos que el microservicio correrá en el puerto 8000 por defecto
    const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

    try {
      // Reenviar el archivo directamente al backend de FastAPI
      const response = await fetch(`${FASTAPI_URL}/predict`, {
        method: 'POST',
        body: formData,
        // No enviamos los headers de la request original ya que el navegador configuró el multipart boundary,
        // al pasar formData, fetch lo configurará correctamente
      });

      if (!response.ok) {
        throw new Error(`Error en FastAPI: ${response.status} ${response.statusText}`);
      }

      // El servidor de FastAPI debería devolver la imagen del heatmap procesada
      const arrayBuffer = await response.arrayBuffer();
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');

      return new NextResponse(arrayBuffer, {
        status: 200,
        headers,
      });
      
    } catch (fetchError) {
      console.error('Error conectando con el microservicio:', fetchError);
      return NextResponse.json(
        { error: 'No se pudo conectar con el microservicio de análisis (FastAPI).' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error en el endpoint de heatmap:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}
