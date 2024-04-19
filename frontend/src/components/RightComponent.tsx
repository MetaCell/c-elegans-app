import {Box, Typography} from "@mui/material";
import {useSharedData} from "../contexts/SharedDataContext.tsx";

export default function RightComponent() {
    const {counter} = useSharedData();

    return (
        <Box>
            <Typography variant="h1">Material + Layout-Manager</Typography>
            <p>Counter: {counter}</p>
        </Box>
    )
}