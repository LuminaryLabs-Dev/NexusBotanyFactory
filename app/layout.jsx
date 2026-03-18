import '../src/styles/globals.css'

export const metadata = {
  title: 'NexusBotanyFactory',
  description: 'Procedural botany factory rebuilt with Next.js MVVM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
