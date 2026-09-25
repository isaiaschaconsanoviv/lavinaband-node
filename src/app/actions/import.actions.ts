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

export async function importMuflForSong(songId: string, formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return { success: false, message: 'No tienes permisos.' };
    }

    const file = formData.get('file') as File;
    if (!file) return { success: false, message: 'No se envió archivo.' };

    const arrayBuffer = await file.arrayBuffer();
    const parsed = javaDeserialization.parse(Buffer.from(arrayBuffer));

    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].list || parsed[0].list.length === 0) {
      return { success: false, message: 'Archivo inválido o vacío.' };
    }

    const item = parsed[0].list[0]; // Take the first song
    
    await dbConnect();
    const song = await Song.findByIdAndUpdate(songId, {
      $set: {
        key: item.note || '',
        lyrics: item.lyrics || item.text || item.songText || item.letra || '',
        formatting: item.formatting || '',
        lyricsHTML: item.lyricsHTML || '',
        status: 'ACTIVE'
      }
    });

    if (!song) return { success: false, message: 'Canción no encontrada.' };

    revalidatePath('/songs');
    return { success: true, message: '¡Canción aprobada y actualizada con el archivo!' };
  } catch (error: any) {
    console.error('Import specific error:', error);
    return { success: false, message: 'Error inesperado: ' + error.message };
  }
}
