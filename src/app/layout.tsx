import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ChatProvider } from '@/contexts/ChatContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '智能聊天系统',
  description: '支持多模式的智能聊天系统，包含普通聊天、RAG模式和智能体功能',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN"  className="h-full">
      <body className={`${inter.className} h-full`}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}