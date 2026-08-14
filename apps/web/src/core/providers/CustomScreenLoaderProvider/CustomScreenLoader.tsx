import { useLoader } from "./CustomScreenLoaderProvider";

const Loader = () => {
  const { isLoading, message } = useLoader();

  if (!isLoading) return null;

  return (
    <div id="loader">
      <div className="mb-4 spinner"></div>
      <p className="text-lg text-black">{message}</p>
    </div>
  );
};

export default Loader;
