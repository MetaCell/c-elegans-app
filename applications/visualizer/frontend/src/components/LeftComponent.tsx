import {Box, Typography} from "@mui/material";
import { useEffect, useState } from "react";
import { HeathcheckService } from "../rest";

export default function LeftComponent() {
    const [ready, setReady] = useState("Not ready")

    useEffect(() => {
        HeathcheckService.ready().then(answer => setReady(answer))
    }, [])

    return (
        <Box>
            <Typography variant="h1">Vite + React + Typescript</Typography>
            <Typography variant="h3">API state: {ready}</Typography>
        </Box>
    )
}