export default function SneekPeek() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-4 bg-black text-white">
      <h1 className="text-3xl font-medium text-gray-100">Work in Progress!</h1>
      <p className="font-light text-center text-gray-200">
        In the meantime, check out my portfolio updates on GitHub
      </p>
      <a
        href="https://github.com/arcanesandip/personal-portfolio"
        target="_blank"
        rel="noopener noreferrer"
      >
        <button className="cursor-pointer rounded bg-white px-4 py-2 font-base text-black hover:bg-gray-300 shadow transition duration-300">
          GitHub
        </button>
      </a>
    </div>
  );
}