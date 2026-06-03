import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { KEYBOARD_BUTTON_ID_MAP, KEYBOARD_LABEL_TO_ID_MAP } from "@/ipc-shared/MessageType";

const functionButtons = ["S", "P", "TIME", "TOTAL"] as const;

type KeyboardSeenProps = {
	lcdText?: string;
	selectedDeviceMac?: string;
	onKeyPress?: (buttonId: number) => void;
	rowOneLabels?: string[];
	rowTwoLabels?: string[];
	recentPressedButtons?: { buttonId: number; timestamp: number }[];
};

export const Keyboard_Seen = ({
	lcdText = "SEEN",
	selectedDeviceMac,
	onKeyPress,
	rowOneLabels = ["$", "L", "F1", "F2", "F3", "F4", "F5", "00", "000", "E"],
	rowTwoLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "C"],
	recentPressedButtons = [],
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
                               // 'Seven Segment',
								fontFamily: "Consolas, 'Courier New', monospace",
								color: "#71ff9b",
								fontSize: 36,
								letterSpacing: "0.08em",
								lineHeight: 1.5,
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

				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
					<Typography sx={{ fontSize: 12, fontWeight: 700, color: "#2b3a4a" }}>
						LAST BUTTONS
					</Typography>
					{recentPressedButtons.slice(0, 10).map((item, idx) => (
						// <Box
						// 	key={`${item.buttonId}-${item.timestamp}-${idx}`}
						// 	sx={{
						// 		minWidth: 34,
						// 		height: 28,
						// 		px: 1,
						// 		borderRadius: 1,
						// 		display: "inline-flex",
						// 		alignItems: "center",
						// 		justifyContent: "center",
						// 		bgcolor: "#f4f7fb",
						// 		border: "1px solid #b6c2cf",
						// 		fontSize: 12,
						// 		fontWeight: 700,
						// 	}}
						// >
							<Chip label={KEYBOARD_BUTTON_ID_MAP[item.buttonId] ?? `#${item.buttonId}`} color="success" />
							
						// </Box>
					))}
					{recentPressedButtons.length === 0 && (
						<Typography sx={{ fontSize: 12, color: "#596575" }}>-</Typography>
					)}
				</Stack>
			</Stack>
		</Paper>
	);
};