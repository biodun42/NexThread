import { useState } from "react";
import Sidebar from "../Components/Navbar/Sidebar";
import Header from "../Components/UI/Header";
import HomeSection from "../Components/Home/HomeSection";


const Home = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex bg-[#F7F8FC] h-screen">
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="sidebar flex-1 flex flex-col overflow-y-scroll">
          <Header
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
          <div className="flex flex-col gap-8">
            <HomeSection />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
