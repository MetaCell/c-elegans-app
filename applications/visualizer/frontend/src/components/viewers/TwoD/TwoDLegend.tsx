import { Box, Divider, IconButton, Typography } from "@mui/material";
import type React from "react";
import { type ColoringOptions, getColorMap, legendNodeNameMapping } from "../../../helpers/twoD/coloringHelper";
import { LegendType, annotationLegend, connectionsLegend } from "../../../settings/twoDSettings";
import { vars } from "../../../theme/variables";

const { gray100 } = vars;

interface LegendNodeProps {
  name: string;
  color: string;
  onClick: () => void;
  highlighted: boolean;
}

interface LegendConnectionProps {
  name: string;
  icon: JSX.Element;
  onClick: () => void;
  highlighted: boolean;
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
        padding: 0,
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
  setLegendHighlights: React.Dispatch<React.SetStateAction<Map<LegendType, string>>>;
  legendHighlights: Map<LegendType, string>;
  includeAnnotations: boolean;
}

const TwoDLegend: React.FC<LegendProps> = ({ coloringOption, setLegendHighlights, legendHighlights, includeAnnotations }) => {
  const handleLegendClick = (type: LegendType, value: string) => {
    setLegendHighlights((prevState) => {
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
  const nodeHighlight = legendHighlights.has(LegendType.Node);
  const connectionHighlight = legendHighlights.has(LegendType.Connection);
  const annotationHighlight = legendHighlights.has(LegendType.Annotation);

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
          onClick={() => handleLegendClick(LegendType.Node, name)}
          highlighted={!nodeHighlight || legendHighlights.get(LegendType.Node) === name}
        />
      ))}
      <Divider sx={{ my: 1, borderColor: gray100 }} />
      {Object.entries(connectionsLegend).map(([key, { name, icon }]) => (
        <LegendConnection
          key={key}
          name={name}
          icon={icon}
          onClick={() => handleLegendClick(LegendType.Connection, key)}
          highlighted={!connectionHighlight || legendHighlights.get(LegendType.Connection) === key}
        />
      ))}
      {includeAnnotations && (
        <>
          <Divider sx={{ my: 1, borderColor: gray100 }} />
          {Object.entries(annotationLegend).map(([key, { id, name, icon }]) => (
            <LegendConnection
              key={key}
              name={name}
              icon={icon}
              onClick={() => handleLegendClick(LegendType.Annotation, id)}
              highlighted={!annotationHighlight || legendHighlights.get(LegendType.Annotation) === id}
            />
          ))}
        </>
      )}
    </Box>
  );
};

export default TwoDLegend;
