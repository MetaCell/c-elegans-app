import {Box, Divider, IconButton, Typography} from "@mui/material";
import React from "react";
import {ColoringOptions, getColorMap, legendNodeNameMapping} from "../../../helpers/twoD/coloringHelper";
import {GraphType, connectionsLegend} from "../../../settings/twoDSettings";
import {vars} from "../../../theme/variables";

const {gray100} = vars;

interface LegendNodeProps {
    name: string;
    color: string;
    onClick: () => void;
}

interface LegendConnectionProps {
    name: string;
    icon: JSX.Element;
    onClick: () => void;
}

const LegendNode: React.FC<LegendNodeProps> = ({ name, color, onClick, highlighted }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            margin: ".75rem 0",
            cursor: "pointer",
            opacity: highlighted ? 1 : 0.3,
        }}
        onClick={onClick}
    >
        <Box sx={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: color, marginRight: 1 }} />
        <Typography variant="body2">{name}</Typography>
    </Box>
);

const LegendConnection: React.FC<LegendConnectionProps> = ({ name, icon, onClick, highlighted }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            margin: ".75rem 0",
            cursor: "pointer",
            opacity: highlighted ? 1 : 0.3,
        }}
        onClick={onClick}
    >
        <IconButton
            size="small"
            sx={{
                marginRight: 1,
                "&:hover": {
                    backgroundColor: "transparent",
                },
            }}
        >
            {icon}
        </IconButton>
        <Typography variant="body2">{name}</Typography>
    </Box>
);

interface LegendProps {
    coloringOption: ColoringOptions;
    setLegendHighlights: React.Dispatch<React.SetStateAction<Map<GraphType, string>>>;
    legendHighlights: Map<GraphType, string>;
}

const TwoDLegend: React.FC<LegendProps> = ({ coloringOption, setLegendHighlights, legendHighlights }) => {

    const handleLegendClick = (type: GraphType, value: string) => {
        setLegendHighlights(prevState => {
            const newMap = new Map([...prevState.entries()]);
            if (newMap.get(type) === value) {
                newMap.delete(type);
            } else {
                newMap.set(type, value);
            }
            return newMap;
        });
    };

    const colorMap = getColorMap(coloringOption);
    const nodeHighlight = legendHighlights.has(GraphType.Node);
    const connectionHighlight = legendHighlights.has(GraphType.Connection);

    return (
        <Box
            sx={{
                padding: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(245, 245, 244, 0.80)",
                backdropFilter: "blur(20px)",
            }}
        >
            {Object.entries(colorMap).map(([name, color]) => (
                <LegendNode
                    key={name}
                    name={legendNodeNameMapping[name]}
                    color={color}
                    onClick={() => handleLegendClick(GraphType.Node, name)}
                    highlighted={!nodeHighlight || legendHighlights.get(GraphType.Node) === name}
                />
            ))}
            <Divider sx={{ my: 1, borderColor: gray100 }} />
            {Object.entries(connectionsLegend).map(([key, { name, icon }]) => (
                <LegendConnection
                    key={key}
                    name={name}
                    icon={icon}
                    onClick={() => handleLegendClick(GraphType.Connection, key)}
                    highlighted={!connectionHighlight || legendHighlights.get(GraphType.Connection) === key}
                />
            ))}
        </Box>
    );
};

export default TwoDLegend;
