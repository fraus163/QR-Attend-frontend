import Layout from "../layouts/Layout.tsx";
import type {FC} from "react";

interface MainPageProps {
    role: string;
}

const MainPage: FC<MainPageProps>  = ({ role }) => {
    return (
        <Layout role={role}/>
    );
};

export default MainPage;