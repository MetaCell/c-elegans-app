import DatasetOutlinedIcon from "@mui/icons-material/DatasetOutlined";
import { Box, Stack, Typography } from "@mui/material";
import { vars } from "../../../theme/variables";
import content from "../content.json";
import { styles } from "../styles";
import type { DatasetEntryProps } from "./types";

export const DatasetEntry = ({ title, children }: DatasetEntryProps) => (
  <Stack spacing={1}>
    <Box sx={styles.datasetEntry}>
      <DatasetOutlinedIcon
        sx={{
          mr: 1,
          width: "1.25rem !important",
          height: "1.25rem !important",
        }}
      />
      <Typography variant="subtitle1" color={vars.gray900} lineHeight={1}>
        {title}
      </Typography>
    </Box>
    <Typography
      variant="body1"
      paragraph
      dangerouslySetInnerHTML={{
        __html: String(children).replace(/\n/g, "<br />"),
      }}
    />
  </Stack>
);

export const DataSourcesContent = () => (
  <Stack spacing={3} p={2}>
    {content.dataSources.entries.map((entry) => (
      <DatasetEntry key={entry.title} title={entry.title}>
        {entry.content}
      </DatasetEntry>
    ))}
  </Stack>
);

export const ConnectionTypesContent = () => (
  <Stack spacing={2} p={2}>
    <Typography
      variant="body1"
      paragraph
      dangerouslySetInnerHTML={{
        __html: content.connectionTypes.description.replace(/\n/g, "<br />"),
      }}
    />
  </Stack>
);

export const DownloadDataContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="body1" paragraph>
      {content.downloadData.description}
    </Typography>
  </Stack>
);

export const CiteUsContent = () => (
  <Stack spacing={2} p={2}>
    <Typography
      variant="body1"
      paragraph
      dangerouslySetInnerHTML={{
        __html: content.citeUs.description.replace(/\n/g, "<br />"),
      }}
    />
  </Stack>
);

export const ContributeContent = () => (
  <Stack spacing={2} p={2}>
    <Typography
      variant="body1"
      paragraph
      dangerouslySetInnerHTML={{
        __html: content.contribute.description.replace(/\n/g, "<br />"),
      }}
    />
  </Stack>
);

export const ContactContent = () => (
  <Stack spacing={2} p={2}>
    <Typography
      variant="body1"
      paragraph
      dangerouslySetInnerHTML={{
        __html: content.contact.description.replace(/\n/g, "<br />"),
      }}
    />
  </Stack>
);
