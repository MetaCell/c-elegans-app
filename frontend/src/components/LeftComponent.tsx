import {Box, Typography} from "@mui/material";
import {useSharedData} from "../contexts/SharedDataContext.tsx";

export default function LeftComponent() {
    const {counter, updateCounter} = useSharedData();

    return (
        <Box>
            <Typography variant="h1">Vite + React + Typescript</Typography>
            <p>Counter: {counter}</p>
            <button onClick={() => updateCounter()}>
                Update Counter
            </button>
        </Box>
    )
}