import { memo } from "react";

import logo from "@/assets/react.svg";

/**
 * The SplashScreen component is responsible for rendering a splash screen with a logo and a loading spinner.
 * It uses various components to render the logo and spinner.
 * The component is memoized to prevent unnecessary re-renders.
 */
function SplashScreen() {
  return (
    <div id="splash-screen" className="!bg-background">
      <div className="logo">
        <img src={logo} alt="logo" className="object-cover w-6 mx-auto" />
      </div>
      <div id="spinner">
        <div className="bounce1 bg-primary" />
        <div className="bounce2 bg-primary" />
        <div className="bounce3 bg-primary" />
      </div>
    </div>
  );
}

export default memo(SplashScreen);
