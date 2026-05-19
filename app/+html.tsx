import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
body, html, #root {
  background-color: #070709;
  height: 100%;
  overflow: hidden;
}

/* Make all interactive elements show pointer cursor */
div[role="button"],
div[tabindex],
button {
  cursor: pointer;
}

/* Remove grey tap flash on mobile web */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Prevent text selection on nav/buttons */
nav, button, [role="button"] {
  user-select: none;
  -webkit-user-select: none;
}

/* Smooth font rendering */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
