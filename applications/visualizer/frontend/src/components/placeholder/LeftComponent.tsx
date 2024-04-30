import {Box, Button, Typography} from "@mui/material";
import { useEffect, useState } from "react";
import {Dataset, DatasetsService, HealthcheckService, Neuron, NeuronsService} from "../../rest";

export default function LeftComponent() {
    const [ready, setReady] = useState("Not ready")
    const [dataset, setDataset] = useState<Dataset>()
    const [allDataset, setAllDataset] = useState<Dataset[]>()
    const [currentPage, setCurrentPage] = useState<{page: number, loadedElements: number, totalElements: number}>({page: 0, loadedElements: 0, totalElements: 1})
    const [neurons, setNeurons] = useState<Neuron[]>([])

    useEffect(() => {
        HealthcheckService.ready().then(answer => setReady(answer))
        DatasetsService.getDataset({dataset: 'white_1986_whole'}).then(answer => setDataset(answer))
        DatasetsService.getAllDatasets().then(answer => setAllDataset(answer))
        loadMoreNeurons()
    }, [])

    const loadMoreNeurons = async () => {
        const page = currentPage.page + 1
        const neuronPage = await NeuronsService.getAllCells({page: page})
        setNeurons([...neurons, ...neuronPage.items])
        setCurrentPage({page: page, loadedElements: neurons.length, totalElements: neuronPage.count})
    }

    return (
        <Box>
            <Typography variant="h1">Vite + React + Typescript</Typography>
            <Typography variant="h3">API state: {ready}</Typography>
            <Typography variant="h3">Dataset: {JSON.stringify(dataset)}</Typography>
            <Typography variant="h3">All datasets names:</Typography>
            <Box>
                {
                    allDataset?.map(x => <Typography key={x.name} variant="body1">{x.name}</Typography>)
                }
            </Box>
            <Typography variant="h3">Neurons:</Typography>
            <Box>
                {
                    neurons?.map(x => <Typography key={x.name} variant="body1">{x.name}</Typography>)
                }
                <Button disabled={currentPage.loadedElements >= currentPage.totalElements} onClick={loadMoreNeurons}>Load more</Button>
            </Box>
        </Box>
    )
}