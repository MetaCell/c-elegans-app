import DatasetOutlinedIcon from "@mui/icons-material/DatasetOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { Alert, Box, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { Dataset } from "../../../rest/models/Dataset";
import { DatasetsService } from "../../../rest/services/DatasetsService";
import { vars } from "../../../theme/variables";
import content from "../content.json";
import { styles } from "../styles";
import type { DatasetEntryProps } from "./types";

export const DatasetEntry = ({ title, children, icon = true }: DatasetEntryProps) => (
  <Stack spacing={1}>
    <Box sx={styles.datasetEntry}>
      {icon && (
        <DatasetOutlinedIcon
          sx={{
            mr: 1,
            width: "1.25rem !important",
            height: "1.25rem !important",
          }}
        />
      )}
      <Typography variant="subtitle1" color={vars.gray900} lineHeight={1}>
        {title}
      </Typography>
    </Box>
    {children && (
      <Typography
        variant="body1"
        paragraph
        dangerouslySetInnerHTML={{
          __html: String(children).replace(/\n/g, "<br />"),
        }}
      />
    )}
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

export const DownloadDataContent = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const datasetsData = await DatasetsService.getDatasets({});
        setDatasets(datasetsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch datasets");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);
  console.log(datasets);

  // Group datasets by the first part of their ID (before first underscore)
  const groupedDatasets = datasets.reduce(
    (groups, dataset) => {
      const groupKey = dataset.name.split(",").slice(0, 2).join(",").trim();
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(dataset);
      return groups;
    },
    {} as Record<string, Dataset[]>,
  );

  if (loading) {
    return (
      <Stack spacing={2} p={2} alignItems="center">
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading datasets...
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} p={2}>
        <Alert severity="error">Failed to load datasets: {error}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} p={2}>
      <Stack spacing={3}>
        {Object.entries(groupedDatasets)
          .reverse()
          .map(([groupKey, groupDatasets]) => (
            <Stack key={groupKey} spacing={2}>
              {groupDatasets.length > 1 && <DatasetEntry key={groupKey} title={groupKey} icon={false} />}

              <Stack spacing={1}>
                {groupDatasets.map((dataset) => {
                  // Remove the group name from the dataset name to avoid repetition
                  const specificName = groupDatasets.length > 1 ? dataset.name.replace(`${groupKey}, `, "") : dataset.name;
                  return (
                    <Box sx={styles.datasetDownloadItem}>
                      <Box sx={styles.datasetDownloadIcon} className="datasetDownloadIcon">
                        <FileDownloadOutlinedIcon fontSize="small" sx={{ color: "#535350" }} />
                      </Box>
                      <Typography sx={styles.datasetDownloadText}>{specificName}</Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          ))}
      </Stack>
    </Stack>
  );
};

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
