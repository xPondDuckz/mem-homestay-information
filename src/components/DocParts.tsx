import React from 'react';
import { Home } from 'lucide-react';

/** Shared header for printable documents. */
export const DocHeader: React.FC<{ title: string; titleEn: string; right?: React.ReactNode }> = ({ title, titleEn, right }) => (
  <header className="pb-6" style={{ borderBottom: '1px solid #ebe9e4' }}>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand)' }}>
          <Home className="w-5 h-5 text-white" aria-hidden />
        </span>
        <div>
          <p className="text-[17px] font-semibold leading-tight">เมม โฮมสเตย์ <span className="font-normal" style={{ color: '#8f8d85' }}>Mem Homestay</span></p>
          <p className="text-xs mt-1" style={{ color: '#57564f' }}>181 หมู่ 6 ตำบลชุมโค อำเภอปะทิว จังหวัดชุมพร 86160</p>
          <p className="text-xs" style={{ color: '#57564f' }}>โทร. 087-8939131</p>
        </div>
      </div>
      <div className="sm:text-right">
        <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
        <p className="text-xs mt-0.5" style={{ color: '#8f8d85' }}>{titleEn}</p>
        {right}
      </div>
    </div>
  </header>
);

/** Thank-you note + signature line. */
export const DocSignature: React.FC<{ name?: string; role: string }> = ({ name, role }) => (
  <footer className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-10 items-end">
    <div className="text-xs" style={{ color: '#8f8d85' }}>
      <p className="text-[13px]" style={{ color: '#1b1b19' }}>ขอบคุณที่ใช้บริการ</p>
      <p>Thank you for staying with Mem Homestay</p>
    </div>
    <div className="text-center sm:ml-auto sm:w-[220px]">
      <div className="h-9 flex items-end justify-center pb-1" style={{ borderBottom: '1px solid #1b1b19' }}>{name}</div>
      <p className="text-xs mt-1.5" style={{ color: '#8f8d85' }}>{role}</p>
    </div>
  </footer>
);
