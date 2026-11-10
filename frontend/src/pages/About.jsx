import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.body.classList.add('allow-scroll');
    return () => document.body.classList.remove('allow-scroll');
  }, []);

  return (
    <main className="page-about">
      <h1 className="about-title">
        Dametreus Ward is the name, the Artist &amp; CEO of Meech213.
        Owner of MeechStudios. Based in Los Angeles and relocating
        to New York fall 2026.
      </h1>

      <figure className="about-portrait">
        <img
          src="https://picsum.photos/seed/m213-ward/1040/1480?grayscale"
          alt="Dametreus Ward, Artist and CEO of Meech213"
        />
      </figure>

      <div className="about-mission">
        <img
          className="about-thumb"
          src="https://picsum.photos/seed/m213-ward-thumb/264/320?grayscale"
          alt=""
        />
        <p>
          My mission is to deliver high fashion/beauty artistically, while
          providing excellent personal attention and demonstrating a unique
          experience for each and every client.
        </p>
      </div>
    </main>
  );
}