import { NextResponse } from 'next/server';
import Setting from '@/models/Setting';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const bulletin = await Setting.findOne({ key: 'bulletinBoard' });
    if (bulletin && bulletin.value) {
      for (const ann of bulletin.value) {
        if (!ann.text) continue;
        const regex = /https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(?:v\d+\/)?([^\.]+)/g;
        let match;
        while ((match = regex.exec(ann.text)) !== null) {
          const publicId = match[1];
          try { await cloudinary.uploader.destroy(publicId); } catch (e) {}
        }
      }
      bulletin.value = [];
      await bulletin.save();
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
