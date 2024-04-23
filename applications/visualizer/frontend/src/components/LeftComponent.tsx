import {Box, Typography} from "@mui/material";

import {useGlobalContext} from "../contexts/GlobalContext.tsx";

export default function LeftComponent() {
    const {datasets, neurons} = useGlobalContext();

    const datasetArray = datasets ? Object.values(datasets) : [];
    const neuronArray = neurons ? Object.values(neurons) : [];
    return (
        <Box>
            <Typography variant="h1">Vite + React + Typescript</Typography>
            <Typography variant="h3">All datasets names:</Typography>
            <Box>
                {
                    // Render each dataset name
                    datasetArray.map(dataset => (
                        <Typography key={dataset.id} variant="body1">{dataset.name}</Typography>
                    ))
                }
            </Box>
            <Typography variant="h3">Neurons:</Typography>
            <Box>
                {
                    // Render each neuron name
                    neuronArray.map(neuron => (
                        <Typography key={neuron.id} variant="body1">{neuron.name}</Typography>
                    ))
                }
            </Box>
        </Box>
    );
}