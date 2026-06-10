import { useDispatch, useSelector, useStore } from "react-redux";

export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
export const useAppStore = () => useStore();
