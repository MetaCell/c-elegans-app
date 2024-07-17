import React from 'react';
import {Typography, Box, IconButton, Divider} from '@mui/material';
import {connectionsLegend, GraphType} from "../../../settings/twoDSettings.tsx";
import {vars} from "../../../theme/variables.ts";
import {ColoringOptions, getColorMap} from "../../../helpers/twoD/coloringHelper.ts";

const {gray100} = vars
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
        margin: '.75rem 0',
        cursor: 'pointer',
    }} onClick={onClick}>
        <Box sx={{width: 16, height: 16, borderRadius: '50%', backgroundColor: color, marginRight: 1}}/>
        <Typography variant="body2">{name}</Typography>
    </Box>
);

const LegendConnection: React.FC<LegendConnectionProps> = ({name, icon, onClick}) => (
    <Box sx={{
        display: 'flex',
        alignItems: 'center',
        margin: '.75rem 0',
        cursor: 'pointer',
    }} onClick={onClick}>
        <IconButton size="small" sx={{
          marginRight: 1,
          '&:hover': {
            backgroundColor: 'transparent',
          },
        }}>
            {icon}
        </IconButton>
        <Typography variant="body2">{name}</Typography>
    </Box>
);

interface LegendProps {
    coloringOption: ColoringOptions;
    onClick: (type: GraphType, name: string) => void;
}

const TwoDLegend: React.FC<LegendProps> = ({ coloringOption, onClick }) => {
    const colorMap = getColorMap(coloringOption);

    return (
        <Box sx={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: 'rgba(245, 245, 244, 0.80)', backdropFilter: 'blur(20px)' }}>
            {Object.entries(colorMap).map(([name, color]) => (
                <LegendNode key={name} name={name} color={color} onClick={() => onClick(GraphType.Node, name)} />
            ))}
            <Divider sx={{ my: 1, borderColor: gray100 }} />
            {Object.entries(connectionsLegend).map(([key, { name, icon }]) => (
                <LegendConnection key={key} name={name} icon={icon} onClick={() => onClick(GraphType.Connection, name)} />
            ))}
        </Box>
    );
};

export default TwoDLegend;