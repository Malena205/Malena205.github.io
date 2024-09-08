import BoardGameGeekWidget from '../components/BoardGameGeekWidget';
import GoodreadsWidget from '../components/GoodreadsWidget';

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-4 sm:px-8 sm:py-8 md:px-16 md:py-16 lg:py-24">
      <div className='grid sm:grid-cols-[1fr_2fr] gap-4 md:gap-8'>
        <img
          className="w-64 max-w-full sm:w-full rounded-xl aspect-square"
          src="/profile-pic.jpg"
          alt="Headshot of Malena Schmidt"
        />
        <div className='space-y-4'>
          <h1 className="text-4xl lg:text-5xl font-bold">Malena Schmidt</h1>
          <p className="text-lg md:text-xl">Hi, I&apos;m Malena. I work as a Quantitative Analyst at G-Research in London. In my free time I enjoy reading fantasy and science fiction books and playing board games. My favourite board games at the moment are Spirit Island, Star Realms and Res Arcana.</p>
          <p className="text-lg md:text-xl">
            <a href="https://www.linkedin.com/in/judith-malena-schmidt/" target="_blank" className="underline">LinkedIn</a>
            {" · "}
            <a href="https://github.com/Lena205" target="_blank" className="underline">GitHub</a>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-12 mt-8">
        <div>
          <h2 className="text-2xl mb-2">Last Played</h2>
          <hr className="mb-4" />
          <BoardGameGeekWidget />
        </div>
        <div>
          <h2 className="text-2xl mb-2">Last Read</h2>
          <hr className="mb-4" />
          <GoodreadsWidget />          
        </div>
      </div>
    </main>
  );
}
