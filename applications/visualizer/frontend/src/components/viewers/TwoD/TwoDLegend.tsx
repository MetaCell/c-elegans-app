import React from 'react';
import {Typography, Box, IconButton, Divider} from '@mui/material';
import {connectionsLegend, GraphType} from "../../../settings/twoDSettings.tsx";
import {ColoringStrategy} from "../../../helpers/twoD/coloringStrategy/ColoringStrategy.ts";

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

const LegendNode: React.FC<LegendNodeProps> = ({name, color, onClick}) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        margin: '8px 0',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
    }} onClick={onClick}>
        <Box sx={{width: 16, height: 16, borderRadius: '50%', backgroundColor: color, marginRight: 1}}/>
        <Typography variant="body2">{name}</Typography>
    </Box>
);

const LegendConnection: React.FC<LegendConnectionProps> = ({name, icon, onClick}) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        margin: '8px 0',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
    }} onClick={onClick}>
        <IconButton size="small" sx={{marginRight: 1}}>
            {icon}
        </IconButton>
        <Typography variant="body2">{name}</Typography>
    </Box>
);

interface LegendProps {
    coloringStrategy: ColoringStrategy;
    onClick: (graphType, name) => void;
}

const TwoDLegend: React.FC<LegendProps> = ({coloringStrategy, onClick}) => {
    const colorMap = coloringStrategy.getColorMap();

    return (
        <Box sx={{padding: 2}}>
            {Object.entries(colorMap).map(([name, color]) => (
                <LegendNode key={name} name={name} color={color} onClick={() => onClick(GraphType.Node, name)}/>
            ))}
            <Divider sx={{my: 1}}/>
            {Object.entries(connectionsLegend).map(([key, {name, icon}]) => (
                <LegendConnection key={key} name={name} icon={icon}
                                  onClick={() => onClick(GraphType.Connection, name)}/>
            ))}
        </Box>
    );
};
export default TwoDLegend;