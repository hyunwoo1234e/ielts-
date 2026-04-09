export const metadata = {
  title: 'NstepIELTS 학생관리',
  description: 'IELTS 학생 맞춤 관리 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#070d1e' }}>
        {children}
      </body>
    </html>
  );
}
