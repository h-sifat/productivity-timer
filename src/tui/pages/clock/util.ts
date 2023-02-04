import type { CanvasContext, Coordinate } from "./interface";

export interface getHandEdge_Argument {
  angleDeg: number;
  handLength: number;
  origin: Coordinate;
}

export function getHandEdge(arg: getHandEdge_Argument) {
  const { angleDeg, handLength, origin } = arg;

  return {
    x: origin.x + Math.round(handLength * Math.cos(degreesToRadian(angleDeg))),
    y: origin.y - Math.round(handLength * Math.sin(degreesToRadian(angleDeg))),
  };
}

export function degreesToRadian(degrees: number) {
  return degrees * (Math.PI / 180);
}

export interface drawLine_Argument {
  to: Coordinate;
  from: Coordinate;
  ctx: CanvasContext;
}

export function drawLine({ from, to, ctx }: drawLine_Argument) {
  ctx.beginPath();

  ctx.lineTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);

  ctx.closePath();
  ctx.stroke();
}

export interface drawClockCircle_Argument {
  center: Coordinate;
  radius: number;
  ctx: CanvasContext;
}
export function drawClockCircle(arg: drawClockCircle_Argument) {
  const { center, radius, ctx } = arg;

  for (let i = 0; i < 2; i += 0.5) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius - i, 0, Math.PI * 2);
    ctx.closePath();
    ctx.stroke();
  }
}

/**
 * Returns angles in degrees.
 * */
export function dateToClockHandAngles(date: Date) {
  return {
    minute: date.getMinutes() * -6 + 90,
    second: date.getSeconds() * -6 + 90,
    hour: (date.getHours() * 60 + date.getMinutes()) * -0.5 + 90,
  };
}

export interface drawClock_Argument {
  date: Date;
  radius: number;
  center: Coordinate;
  ctx: CanvasContext;
}

export function drawClock(arg: drawClock_Argument) {
  const { date, ctx, radius, center } = arg;

  ctx.clearRect(0, 0, ctx.width, ctx.height);
  const handLengths = Object.freeze({
    hour: radius - 15,
    minute: radius - 10,
    second: radius - 5,
  } as const);

  const handAngles: any = dateToClockHandAngles(date);
  for (const [handName, handLength] of Object.entries(handLengths))
    drawLine({
      ctx,
      from: center,
      to: getHandEdge({
        handLength,
        origin: center,
        angleDeg: handAngles[handName],
      }),
    });

  drawClockCircle({ ctx, center, radius });

  return ctx.toString();
}
