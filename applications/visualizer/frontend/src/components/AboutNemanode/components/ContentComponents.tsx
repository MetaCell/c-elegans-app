import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { TableChart } from "@mui/icons-material";
import { DatasetEntryProps } from "./types";
import { styles } from "../styles";
import content from "../content.json";

export const DatasetEntry = ({ title, children }: DatasetEntryProps) => (
  <>
    <Box sx={styles.datasetEntry}>
      <TableChart sx={{ mr: 1, color: "text.secondary" }} />
      <Typography variant="h6" component="h3" sx={{ fontWeight: "normal" }}>
        {title}
      </Typography>
    </Box>
    <Box>
      <Typography variant="body1" color="text.secondary">
        {children}
      </Typography>
    </Box>
  </>
);

export const DataSourcesContent = () => (
  <Stack spacing={2} p={2}>
    {content.dataSources.entries.map((entry) => (
      <DatasetEntry key={entry.title} title={entry.title}>
        {entry.content}
      </DatasetEntry>
    ))}
  </Stack>
);

export const ConnectionTypesContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="h6" gutterBottom>
      {content.connectionTypes.title}
    </Typography>
    <Typography variant="body1" paragraph>
      {content.connectionTypes.description}
    </Typography>

    <Stack spacing={2}>
      {content.connectionTypes.types.map((type) => (
        <Box key={type.title}>
          <Typography variant="subtitle1" sx={styles.subtitle}>
            {type.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {type.description}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Stack>
);

export const DownloadDataContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="h6" gutterBottom>
      {content.downloadData.title}
    </Typography>
    <Typography variant="body1" paragraph>
      {content.downloadData.description}
    </Typography>

    <Stack spacing={2}>
      {content.downloadData.formats.map((format) => (
        <Box key={format.title}>
          <Typography variant="subtitle1" sx={styles.subtitle}>
            {format.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {format.description}
            <br />
            <Button variant="outlined" size="small">
              Download {format.title.split(" ")[0]}
            </Button>
          </Typography>
        </Box>
      ))}
    </Stack>

    <Stack spacing={2} sx={styles.infoBox}>
      <Typography variant="subtitle1" sx={styles.subtitle}>
        {content.downloadData.apiAccess.title}
      </Typography>
      <Typography variant="body1">
        {content.downloadData.apiAccess.description}
      </Typography>
    </Stack>
  </Stack>
);

export const CiteUsContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="h6" gutterBottom>
      {content.citeUs.title}
    </Typography>
    <Typography variant="body1" paragraph>
      {content.citeUs.description}
    </Typography>

    <Stack spacing={2}>
      {content.citeUs.citations.map((citation) => (
        <Box key={citation.title}>
          <Typography variant="subtitle1" sx={styles.subtitle}>
            {citation.title}
          </Typography>
          <Typography variant="body1" sx={styles.citationBox}>
            {citation.citation}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Stack>
);

export const ContributeContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="h6" gutterBottom>
      {content.contribute.title}
    </Typography>
    <Typography variant="body1" paragraph>
      {content.contribute.description}
    </Typography>

    {content.contribute.sections.map((section) => (
      <Box key={section.title}>
        <Typography variant="subtitle1" sx={styles.subtitle}>
          {section.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {section.content}
        </Typography>
      </Box>
    ))}

    <Stack spacing={2} sx={styles.infoBox}>
      <Typography variant="subtitle1" sx={styles.subtitle}>
        {content.contribute.submissionProcess.title}
      </Typography>
      <Typography variant="body1">
        {content.contribute.submissionProcess.content}
      </Typography>
    </Stack>
  </Stack>
);

export const ContactContent = () => (
  <Stack spacing={2} p={2}>
    <Typography variant="h6" gutterBottom>
      {content.contact.title}
    </Typography>

    <Stack spacing={2}>
      {content.contact.sections.map((section) => (
        <Box key={section.title}>
          <Typography variant="subtitle1" sx={styles.subtitle}>
            {section.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {section.content} <strong>{section.email}</strong>
          </Typography>
        </Box>
      ))}
    </Stack>

    <Stack spacing={2} sx={styles.infoBox}>
      <Typography variant="subtitle1" sx={styles.subtitle}>
        {content.contact.mailingAddress.title}
      </Typography>
      <Typography variant="body1">
        {content.contact.mailingAddress.lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < content.contact.mailingAddress.lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Typography>
    </Stack>
  </Stack>
);
