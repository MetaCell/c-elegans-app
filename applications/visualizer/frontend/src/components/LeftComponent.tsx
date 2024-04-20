import {Box, Typography} from "@mui/material";
import { useEffect, useState } from "react";
import { Dataset, DatasetsService, HeathcheckService } from "../rest";

export default function LeftComponent() {
    const [ready, setReady] = useState("Not ready")
    const [dataset, setDataset] = useState<Dataset>()
    const [allDataset, setAllDataset] = useState<Dataset[]>()

    useEffect(() => {
        HeathcheckService.ready().then(answer => setReady(answer))
        DatasetsService.getDataset({dataset: 'white_1986_whole'}).then(answer => setDataset(answer))
        DatasetsService.getAllDatasets().then(answer => setAllDataset(answer))
    }, [])

    return (
        <Box>
            <Typography variant="h1">Vite + React + Typescript</Typography>
            <Typography variant="h3">API state: {ready}</Typography>
            <Typography variant="h3">Dataset: {JSON.stringify(dataset)}</Typography>
            <Typography variant="h3">All datasets names:</Typography>
            <Box>
                {
                    allDataset?.map(x => <Typography key={x.name} variant="h4">{x.name}</Typography>)
                }
            </Box>
        </Box>
    )
}