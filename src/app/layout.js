import './globals.css'

export const metadata = {
  title: 'Visora — AI Property Media',
  description: 'AI-powered images and video for residential property sales.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
