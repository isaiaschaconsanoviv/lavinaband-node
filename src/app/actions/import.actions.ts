"use server";
import dbConnect from "@/lib/mongodb";
import Song from "@/models/Song";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Import java-deserialization library using require since it might not have Typescript types
const javaDeserialization = require('java-deserialization');

export async function importHolyricsMufl(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'No tienes permisos de Administrador.' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, message: 'No se envió ningún archivo.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let parsed;
    try {
      parsed = javaDeserialization.parse(buffer);
    } catch (e: any) {
      return { success: false, message: 'Error al procesar el archivo .mufl. ' + e.message };
    }

    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].list) {
      return { success: false, message: 'El archivo no contiene un formato de repertorio válido.' };
    }

    const songsList = parsed[0].list;
    let importedCount = 0;

    await dbConnect();

    for (const item of songsList) {
      if (!item.title) continue;
      
      const title = item.title;
      const artist = item.artist || 'Desconocido';
      const key = item.note || '';
      
      const lyrics = item.lyrics || item.text || item.songText || item.letra || '';
      const formatting = item.formatting || '';
      const lyricsHTML = item.lyricsHTML || '';
      
      // Upsert into DB (find by title & artist, if exists update, if not insert)
      await Song.updateOne(
        { title, artist },
        {
          $set: {
            title,
            artist,
            key,
            lyrics,
            formatting,
            lyricsHTML,
            status: 'ACTIVE',
          }
        },
        { upsert: true }
      );
      
      importedCount++;
    }

    revalidatePath('/songs');
    
    return { 
      success: true, 
      message: `¡Se importaron/actualizaron exitosamente ${importedCount} canciones en el repertorio!` 
    };
  } catch (error: any) {
    console.error('Import error:', error);
    return { success: false, message: 'Error inesperado: ' + error.message };
  }
}
