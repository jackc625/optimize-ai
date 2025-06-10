import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 sm:p-20 gap-16">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <ol className="list-inside list-decimal text-sm text-center sm:text-left leading-relaxed">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-muted text-foreground px-1 py-0.5 rounded font-mono">
              src/app/page.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2 
              bg-primary text-primary-foreground 
              rounded-[var(--radius)] 
              px-4 py-2 h-10 sm:h-12 
              hover:bg-primary-600 
              transition-colors
            "
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            <span className="text-sm sm:text-base">Deploy now</span>
          </a>

          <a
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex items-center gap-2 
              border-border border 
              text-foreground 
              bg-input 
              rounded-[var(--radius)] 
              px-4 py-2 h-10 sm:h-12 sm:min-w-[176px]
              hover:bg-muted 
              transition-colors
            "
          >
            <span className="text-sm sm:text-base">Read our docs</span>
          </a>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary hover:underline hover:underline-offset-4 transition-colors"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          <span>Learn</span>
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary hover:underline hover:underline-offset-4 transition-colors"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          <span>Examples</span>
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-foreground hover:text-primary hover:underline hover:underline-offset-4 transition-colors"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          <span>Go to nextjs.org →</span>
        </a>
      </footer>
    </div>
  );
}
