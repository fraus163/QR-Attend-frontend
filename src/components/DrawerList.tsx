import {Box, List} from "@mui/material";
import type {FC, JSX} from "react";

interface DrawerProps {
    toggleDrawer: (open: boolean) => void;
    tabs: JSX.Element[];
}

const DrawerList: FC<DrawerProps> = ({toggleDrawer, tabs}) => {
    return (
        <Box sx={{ width: 250 }} role="presentation" onClick={() => toggleDrawer(false)}>
            <List>
                {...tabs}
            </List>
        </Box>
    );
};

export default DrawerList;