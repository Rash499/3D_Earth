import { theme } from "./theme";

export function UnavailableNotice({ reason }: { reason: string }) {
  return <p style={styles.text}>Data not yet available — {reason}</p>;
}

const styles = {
  text: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: "italic" as const,
    margin: 0,
  },
};
