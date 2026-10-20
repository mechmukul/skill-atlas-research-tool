import Cocoa
let image = NSImage(size: NSSize(width: 1024, height: 1024))
image.lockFocus()
let background = NSBezierPath(roundedRect: NSRect(x: 32, y: 32, width: 960, height: 960), xRadius: 220, yRadius: 220)
NSColor(calibratedRed: 0.10, green: 0.26, blue: 0.36, alpha: 1).setFill(); background.fill()
for (i, width) in [560.0, 480.0, 400.0].enumerated() {
 let y = 250.0 + Double(i)*160
 let book = NSBezierPath(roundedRect: NSRect(x: (1024-width)/2, y: y, width: width, height: 120), xRadius: 26, yRadius: 26)
 NSColor(calibratedRed: 0.75+Double(i)*0.07, green: 0.88+Double(i)*0.03, blue: 0.92, alpha: 1).setFill(); book.fill()
 let spine = NSBezierPath(); spine.move(to: NSPoint(x: (1024-width)/2+66, y: y+25)); spine.line(to: NSPoint(x: (1024-width)/2+66, y: y+95)); spine.lineWidth = 8; NSColor(calibratedRed: 0.18, green: 0.46, blue: 0.56, alpha: 1).setStroke(); spine.stroke()
}
image.unlockFocus()
let representation = NSBitmapImageRep(data: image.tiffRepresentation!)!
try representation.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
