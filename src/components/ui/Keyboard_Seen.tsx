import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { KEYBOARD_LABEL_TO_ID_MAP } from "@/ipc-shared/MessageType";

const functionButtons = ["S", "P", "TIME", "TOTAL"] as const;

type KeyboardSeenProps = {
	lcdText?: string;
	selectedDeviceMac?: string;
	onKeyPress?: (buttonId: number) => void;
	rowOneLabels?: string[];
	rowTwoLabels?: string[];
};

export const Keyboard_Seen = ({
	lcdText = "SEEN",
	selectedDeviceMac,
	onKeyPress,
	rowOneLabels = ["$", "L", "F1", "F2", "F3", "F4", "F5", "00", "000", "E"],
	rowTwoLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "C"],
}: KeyboardSeenProps) => {
	const renderKey = (label: string, variant: "contained" | "outlined" = "outlined") => {
		const buttonId = KEYBOARD_LABEL_TO_ID_MAP[label];
		return (
			<Button
				key={label}
				variant={variant}
				size="medium"
				onClick={() => {
					if (buttonId !== undefined) {
						onKeyPress?.(buttonId);
					}
				}}
				disabled={!selectedDeviceMac}
				sx={{
					minWidth: 30,
					height: 42,
					px: 1.5,
					fontSize: 12,
					fontWeight: 700,
					borderRadius: 1,
					letterSpacing: 0.3,
				}}
			>
				{label}
			</Button>
		);
	};

	return (
		<Paper
			elevation={8}
			sx={{
               
				p: 2,
				borderRadius: 2,
				bgcolor: "#dadfe4",
				border: "1px solid #b0b9c3",
			}}
		>
			<Stack spacing={2}>
				<Stack direction="row" spacing={3} alignItems="stretch">
					<Paper
						elevation={2}
						sx={{
							flex: 1,
							// minHeight: 110,
                            
							borderRadius: 1.5,
							bgcolor: "#18281c",
							border: "2px solid #0a130c",
							p: 1.25,
						}}
					>
						<Typography
							component="pre"
							sx={{
								m: 0,
                               
								fontFamily: "Consolas, 'Courier New', monospace",
								color: "#71ff9b",
								fontSize: 30,
								lineHeight: 1.3,
								whiteSpace: "pre-wrap",
								userSelect: "none",
							}}
						>
							{lcdText}
						</Typography>
					</Paper>

					<Box
						sx={{
							width: { xs: 136, sm: 164 },
							display: "grid",
							gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
							gap: 1,
						}}
					>
						{functionButtons.map((label) => renderKey(label, "contained"))}
					</Box>
				</Stack>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
						gap: 1,
					}}
				>
					{rowOneLabels.slice(0, 10).map((label, idx) => renderKey(label || `R1-${idx + 1}`))}
				</Box>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(11, minmax(0, 1fr))",
						gap: 1,
					}}
				>
					{rowTwoLabels.slice(0, 11).map((label, idx) => renderKey(label || `R2-${idx + 1}`))}
				</Box>
			</Stack>
		</Paper>
	);
};