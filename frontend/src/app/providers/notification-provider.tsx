import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';

interface Props {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: Props) {
  return (
    <>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
      />
    </>
  );
}
