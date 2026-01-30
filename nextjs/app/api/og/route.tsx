import { ImageResponse } from '@vercel/og';
import { createAdminClient } from '@/utils/supabase/admin';

export const runtime = 'edge';

// DevToDollars theme colors
const colors = {
  primary: '#ffca28',
  surface2: '#1b1b1d',
  gridLine: '#2a2a2a',
  white: '#ffffff',
  gray300: '#999999',
};

// Game of Life pattern - creates a visually interesting static pattern
function generateGameOfLifePattern(
  gridWidth: number,
  gridHeight: number
): boolean[][] {
  const grid: boolean[][] = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill(false));

  const addGlider = (startX: number, startY: number) => {
    const glider = [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
    ];
    for (let y = 0; y < glider.length; y++) {
      for (let x = 0; x < glider[0].length; x++) {
        const gridX = startX + x;
        const gridY = startY + y;
        if (
          gridX < gridWidth &&
          gridY < gridHeight &&
          gridX >= 0 &&
          gridY >= 0
        ) {
          grid[gridY][gridX] = glider[y][x] === 1;
        }
      }
    }
  };

  const addLWSS = (startX: number, startY: number) => {
    const lwss = [
      [0, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0],
    ];
    for (let y = 0; y < lwss.length; y++) {
      for (let x = 0; x < lwss[0].length; x++) {
        const gridX = startX + x;
        const gridY = startY + y;
        if (
          gridX < gridWidth &&
          gridY < gridHeight &&
          gridX >= 0 &&
          gridY >= 0
        ) {
          grid[gridY][gridX] = lwss[y][x] === 1;
        }
      }
    }
  };

  const addPulsarPart = (startX: number, startY: number) => {
    const pattern = [
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    ];
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[0].length; x++) {
        const gridX = startX + x;
        const gridY = startY + y;
        if (
          gridX < gridWidth &&
          gridY < gridHeight &&
          gridX >= 0 &&
          gridY >= 0
        ) {
          grid[gridY][gridX] = pattern[y][x] === 1;
        }
      }
    }
  };

  // Add patterns at various positions
  addGlider(3, 2);
  addGlider(45, 5);
  addGlider(8, 22);
  addGlider(52, 20);
  addGlider(35, 2);
  addLWSS(15, 8);
  addLWSS(38, 18);
  addPulsarPart(20, 12);
  addGlider(55, 12);
  addGlider(2, 15);

  return grid;
}

// Fetch user name from Supabase if userId is provided
async function getUserName(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  try {
    const supabase = createAdminClient();

    // First try public.users table
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (userData?.full_name) {
      return userData.full_name;
    }

    // Fallback to auth.users metadata (requires service role)
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    return (
      authData?.user?.user_metadata?.full_name ||
      authData?.user?.user_metadata?.name ||
      null
    );
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Fetch user name if userId is provided
  const userName = await getUserName(userId);

  const cellSize = 20;
  const gridWidth = Math.ceil(1200 / cellSize);
  const gridHeight = Math.ceil(630 / cellSize);

  const pattern = generateGameOfLifePattern(gridWidth, gridHeight);

  // Pre-compute active cells to reduce rendering complexity
  const activeCells: { x: number; y: number }[] = [];
  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      if (pattern[y][x]) {
        activeCells.push({ x, y });
      }
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.surface2,
          position: 'relative',
        }}
      >
        {/* Grid lines - simplified SVG background */}
        <svg
          width="1200"
          height="630"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Vertical lines */}
          {Array.from({ length: gridWidth + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * cellSize}
              y1={0}
              x2={i * cellSize}
              y2={630}
              stroke={colors.gridLine}
              strokeWidth={1}
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: gridHeight + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * cellSize}
              x2={1200}
              y2={i * cellSize}
              stroke={colors.gridLine}
              strokeWidth={1}
            />
          ))}
          {/* Active cells */}
          {activeCells.map(({ x, y }) => (
            <rect
              key={`c${x}-${y}`}
              x={x * cellSize + 1}
              y={y * cellSize + 1}
              width={cellSize - 2}
              height={cellSize - 2}
              fill={`${colors.primary}99`}
              rx={2}
            />
          ))}
        </svg>

        {/* Gradient overlay for better text readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse at center, ${colors.surface2}dd 0%, ${colors.surface2}66 100%)`,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Personalized greeting - only shown if user has a name */}
          {userName && (
            <p
              style={{
                fontSize: 32,
                color: colors.gray300,
                margin: 0,
                marginBottom: 24,
              }}
            >
              Hello{' '}
              <span style={{ color: colors.primary, fontWeight: 600 }}>
                {userName}
              </span>
            </p>
          )}

          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: colors.primary,
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Tech Co-founder
          </h1>

          <h2
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: colors.white,
              margin: 0,
              marginTop: 8,
              letterSpacing: '0.02em',
            }}
          >
            as a Service
          </h2>

          <p
            style={{
              fontSize: 28,
              color: colors.gray300,
              margin: 0,
              marginTop: 40,
            }}
          >
            Helping Developers Become Founders
          </p>
        </div>

        {/* DevToDollars branding at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: colors.primary,
            }}
          />
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: colors.white,
              letterSpacing: '-0.01em',
            }}
          >
            DevToDollars
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
