import React, { createContext, useContext, useState } from "react";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [headerMessages, setHeaderMessages] = useState([]);

  const updateHeaderMessages = (newMessage) => {
    setHeaderMessages((prev) => {
      const messages = [newMessage, ...prev].slice(0, 5);
      return messages;
    });
  };

  return (
    <StateContext.Provider
      value={{
        user,
        setUser,
        userProfileData,
        setUserProfileData,
        headerMessages,
        updateHeaderMessages,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error(
      "useStateContext must be used within a StateContextProvider"
    );
  }
  return context;
};
