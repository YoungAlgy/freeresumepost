export function GET(request: Request) {
  return Response.redirect(new URL('/upload', request.url), 308)
}
