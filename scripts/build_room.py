# Builds the portfolio room shell in Blender, bakes daylight into textures,
# and exports public/models/room-baked.glb.
#
# Run:  blender -b -P scripts/build_room.py
#
# Coordinates: authored in the Three.js scene's space (x right, y up, z toward
# camera) and converted to Blender (z up) via T(). The glTF exporter converts
# back, so positions in the exported file line up 1:1 with the existing
# procedural objects in Room.tsx / Workstation.tsx.
#
# Baked here (static shell): floor, walls, ceiling, skirting, padded panels,
# window frame + sill, desk body + LED strips, bookshelf + books, rug,
# bean bag + pouf. Interactive things (robot, monitor, keyboard, phone,
# pegboard badges, cabinet/speaker) stay procedural in Three.js.

import math
import os
import sys

import bpy

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "models", "room-baked.glb")
FAST = "--fast" in sys.argv  # low samples smoke-test

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 16 if FAST else 160
scene.cycles.use_denoising = True


def T(x, y, z):
    """three.js (x, y, z) -> blender (x, -z, y)"""
    return (x, -z, y)


# ---------------------------------------------------------------- materials
def mat(name, color, rough=0.85, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    if emit is not None:
        bsdf.inputs["Emission Color"].default_value = (*emit, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emit_strength
    return m


def hexc(h, mul=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    # approximate srgb -> linear
    return tuple(min(1.0, mul * (c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)) for c in srgb)


BAKE = []  # (object, image_size)


def add_bevel(ob, width=0.02, segments=3):
    b = ob.modifiers.new("bevel", "BEVEL")
    b.width = width
    b.segments = segments
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(40)


def box(name, size, pos, material, bevel=0.02, rot=None, bake=512, emissive=False):
    """size/pos in three.js coords."""
    bpy.ops.mesh.primitive_cube_add(size=1)
    ob = bpy.context.object
    ob.name = ("EMIT_" if emissive else "") + name
    ob.scale = (size[0], size[2], size[1])
    ob.location = T(*pos)
    if rot:  # three.js euler (x, y, z) -> blender: ry -> rz
        ob.rotation_euler = (rot[0], -rot[2], rot[1])
    ob.data.materials.append(material)
    if bevel:
        add_bevel(ob, bevel)
    if not emissive and bake:
        BAKE.append((ob, bake))
    return ob


# ---------------------------------------------------------------- palette
col_wall = mat("wall", hexc("53545f"), 0.9)
col_panel = mat("panel", hexc("434450"), 0.85)
col_dark = mat("trim", hexc("15161e"), 0.7)
col_frame = mat("frame", hexc("111218"), 0.6)
col_ceiling = mat("ceiling", hexc("2a2b34"), 0.9)
col_rug = mat("rug", hexc("6e7282"), 0.95)
col_desk_base = mat("desk_base", hexc("2c2d37"), 0.85)
col_desk_base2 = mat("desk_base2", hexc("353641"), 0.85)
col_desk_top = mat("desk_top", hexc("0d0e14"), 0.55)
col_leather = mat("leather", hexc("3a2a20"), 0.95)
col_shelf = mat("shelf", hexc("2a2b33"), 0.8)
col_bean = mat("bean", hexc("d98fb0"), 0.95)
col_bean2 = mat("bean2", hexc("e3a6c2"), 0.95)
emit_amber = mat("led_amber", hexc("ffc46a"), 0.4, emit=hexc("ffc46a"), emit_strength=4.0)

# floor: light tiles via checker-ish brick texture
floor_m = mat("floor", hexc("d9d0bf"), 0.45)
nt = floor_m.node_tree
brick = nt.nodes.new("ShaderNodeTexBrick")
brick.inputs["Scale"].default_value = 1.0
brick.inputs["Color1"].default_value = (*hexc("d9d0bf"), 1)
brick.inputs["Color2"].default_value = (*hexc("cfc5b2"), 1)
brick.inputs["Mortar"].default_value = (*hexc("bfb3a0"), 1)
brick.inputs["Mortar Size"].default_value = 0.012
brick.offset = 0.0
brick.inputs["Brick Width"].default_value = 1.1
brick.inputs["Row Height"].default_value = 1.1
texco = nt.nodes.new("ShaderNodeTexCoord")
mapn = nt.nodes.new("ShaderNodeMapping")
mapn.inputs["Scale"].default_value = (1.0, 1.0, 1.0)
nt.links.new(texco.outputs["Object"], mapn.inputs["Vector"])
nt.links.new(mapn.outputs["Vector"], brick.inputs["Vector"])
nt.links.new(brick.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])

# ---------------------------------------------------------------- geometry
# floor + rug
# floor + rug are procedural in Three.js (dark herringbone + bordered rug)

# ceiling
box("ceiling", (13, 0.1, 11), (0.5, 5.05, -0.5), col_ceiling, bevel=0, bake=512)

# back wall (window opening at x 0.6 +/- 1.7, y 1.7..3.9)
box("wall_back_l", (4.2, 5, 0.1), (-3.2, 2.5, -4.2), col_wall, bevel=0, bake=1024)
box("wall_back_r", (5.2, 5, 0.1), (4.8, 2.5, -4.2), col_wall, bevel=0, bake=1024)
box("wall_back_low", (3.4, 1.7, 0.1), (0.6, 0.85, -4.2), col_wall, bevel=0, bake=512)
box("wall_back_top", (3.4, 1.1, 0.1), (0.6, 4.45, -4.2), col_wall, bevel=0, bake=512)
box("wall_left", (0.1, 5, 9), (-4.6, 2.5, -0.5), col_wall, bevel=0, bake=1024)
# right wall with a window opening (y 1.7..3.9, z -0.4..2.4) above the sofa
box("wall_right_back", (0.1, 5, 3.8), (6.6, 2.5, -2.3), col_wall, bevel=0, bake=768)
box("wall_right_front", (0.1, 5, 1.6), (6.6, 2.5, 3.2), col_wall, bevel=0, bake=512)
box("wall_right_low", (0.1, 1.7, 2.8), (6.6, 0.85, 1.0), col_wall, bevel=0, bake=512)
box("wall_right_top", (0.1, 1.1, 2.8), (6.6, 4.45, 1.0), col_wall, bevel=0, bake=512)
box("rwin_top", (0.1, 0.08, 2.9), (6.56, 3.9, 1.0), col_frame, bevel=0.01, bake=128)
box("rwin_bot", (0.1, 0.08, 2.9), (6.56, 1.66, 1.0), col_frame, bevel=0.01, bake=128)
box("rwin_l", (0.1, 2.3, 0.08), (6.56, 2.78, -0.4), col_frame, bevel=0.01, bake=128)
box("rwin_r", (0.1, 2.3, 0.08), (6.56, 2.78, 2.4), col_frame, bevel=0.01, bake=128)
box("rwin_m", (0.06, 2.2, 0.05), (6.56, 2.78, 1.0), col_frame, bevel=0.008, bake=128)
box("rsill", (0.3, 0.07, 3.0), (6.45, 1.63, 1.0), col_frame, bevel=0.012, bake=192)

# skirting
box("skirt_back", (10.6, 0.14, 0.06), (0.6, 0.07, -4.13), col_dark, bevel=0.008, bake=256)
box("skirt_left", (0.06, 0.14, 8.6), (-4.53, 0.07, -0.5), col_dark, bevel=0.008, bake=256)
box("skirt_right", (0.06, 0.14, 8.6), (6.53, 0.07, -0.5), col_dark, bevel=0.008, bake=256)

# padded panels
for i, (x, y) in enumerate([(-3.95, 1.75), (-2.45, 1.75), (-3.95, 3.35), (-2.45, 3.35)]):
    box(f"pad_b{i}", (1.35, 1.45, 0.07), (x, y, -4.12), col_panel, bevel=0.03, bake=256)
pi = 0
for zz in [-3.45, -2.25, -1.05, 0.15, 1.35, 2.55]:
    for yy in [1.0, 2.2, 3.4]:
        box(f"pad_l{pi}", (0.07, 1.12, 1.12), (-4.51, yy, zz), col_panel, bevel=0.03, bake=192)
        pi += 1

# window frame + mullions + sill
box("win_top", (3.5, 0.08, 0.1), (0.6, 3.9, -4.18), col_frame, bevel=0.01, bake=256)
box("win_bot", (3.5, 0.08, 0.1), (0.6, 1.66, -4.18), col_frame, bevel=0.01, bake=256)
box("win_l", (0.08, 2.3, 0.1), (-1.12, 2.78, -4.18), col_frame, bevel=0.01, bake=256)
box("win_r", (0.08, 2.3, 0.1), (2.32, 2.78, -4.18), col_frame, bevel=0.01, bake=256)
for i, x in enumerate([-0.54, 0.6, 1.74]):
    box(f"win_m{i}", (0.05, 2.2, 0.04), (x, 2.78, -4.16), col_frame, bevel=0.008, bake=128)
box("sill", (3.7, 0.07, 0.3), (0.6, 1.63, -4.08), col_frame, bevel=0.012, bake=256)

# desk (group origin -0.55, 0, -1.75; depth 1.76, top y 0.99..1.04)
box("desk_base", (3.3, 0.9, 1.56), (-0.55, 0.47, -1.75), col_desk_base, bevel=0.07, bake=1024)
box("desk_base2", (3.32, 0.3, 1.58), (-0.55, 0.17, -1.75), col_desk_base2, bevel=0.07, bake=512)
box("desk_top", (3.56, 0.1, 1.76), (-0.55, 0.99, -1.75), col_desk_top, bevel=0.035, bake=1024)
box("desk_mat", (2.75, 0.02, 1.34), (-0.45, 1.045, -1.73), col_leather, bevel=0.01, bake=512)
# LED rim under the slab (emissive, lights the bake) — thick smooth band like the reference
box("led_front", (3.52, 0.06, 0.035), (-0.55, 0.93, -0.89), emit_amber, bevel=0, emissive=True)
box("led_back", (3.52, 0.06, 0.035), (-0.55, 0.93, -2.61), emit_amber, bevel=0, emissive=True)
box("led_rside", (0.035, 0.06, 1.72), (1.21, 0.93, -1.75), emit_amber, bevel=0, emissive=True)
box("led_lside", (0.035, 0.06, 1.72), (-2.31, 0.93, -1.75), emit_amber, bevel=0, emissive=True)

# bookshelf + books (left wall, shelf board at y 2.28)
box("shelf", (0.3, 0.05, 2.3), (-4.42, 2.28, -2.1), col_shelf, bevel=0.012, bake=256)
box("shelf_led", (0.22, 0.012, 2.2), (-4.4, 2.252, -2.1), mat("led_shelf", hexc("ffc46a"), 0.4, emit=hexc("ffc46a"), emit_strength=4.5), bevel=0, emissive=True)
# muted reference-style books: upright clusters with leans + one flat stack
books = [
    (0.36, "31466b", 0.0), (0.42, "6b3138", 0.0), (0.33, "8a6d3b", 0.1), (0.40, "2e5944", 0.0),
    (0.30, "b8b0a0", 0.14), (0.44, "494a57", 0.0), (0.37, "7a4a66", 0.0), (0.31, "3b6b8a", 0.12),
    (0.41, "5d4a38", 0.0), (0.34, "8a8575", 0.0), (0.39, "26323e", -0.12), (0.29, "a8463f", 0.0),
]
z = -3.0
for i, (h, c, lean) in enumerate(books):
    w = 0.055 + (i % 3) * 0.02
    box(f"book{i}", (0.2, h, w), (-4.42, 2.305 + h / 2, z + w / 2), mat(f"book{i}m", hexc(c), 0.85), bevel=0.008, rot=(lean, 0, 0), bake=128)
    z += w + (0.09 if i in (3, 7) else 0.012)
for j, (hh, c) in enumerate([(0.06, "44616b"), (0.05, "8a6d3b"), (0.055, "6b5a7a")]):
    box(f"bookflat{j}", (0.2, hh, 0.3), (-4.42, 2.305 + 0.03 + j * 0.055, -0.3), mat(f"bookflat{j}m", hexc(c), 0.85), bevel=0.008, bake=128)

# bean bag (the cat sleeps on it)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.78, segments=28, ring_count=18)
bb = bpy.context.object
bb.name = "beanbag"
bb.scale = (1, 1, 0.62)
bb.location = T(-2.75, 0.42, 0.75)
bb.data.materials.append(col_bean)
bpy.ops.object.shade_smooth()
BAKE.append((bb, 384))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.64, segments=24, ring_count=16)
bb2 = bpy.context.object
bb2.name = "beanbag_top"
bb2.scale = (1, 1, 0.5)
bb2.location = T(-2.75, 0.55, 0.75)
bb2.data.materials.append(col_bean2)
bpy.ops.object.shade_smooth()
BAKE.append((bb2, 256))

# gray fabric sofa against the right wall, under its window
sofa = mat("sofa", hexc("8a8da0"), 0.95)
sofa2 = mat("sofa2", hexc("7b7e91"), 0.95)
box("sofa_base", (0.95, 0.4, 2.3), (4.15, 0.32, 1.7), sofa2, bevel=0.06, bake=512)
box("sofa_seat1", (0.85, 0.2, 1.05), (4.1, 0.58, 1.16), sofa, bevel=0.07, bake=256)
box("sofa_seat2", (0.85, 0.2, 1.05), (4.1, 0.58, 2.26), sofa, bevel=0.07, bake=256)
box("sofa_back1", (0.25, 0.62, 1.05), (4.48, 1.0, 1.16), sofa, bevel=0.07, bake=256)
box("sofa_back2", (0.25, 0.62, 1.05), (4.48, 1.0, 2.26), sofa, bevel=0.07, bake=256)
box("sofa_arm1", (0.9, 0.62, 0.26), (4.15, 0.55, 0.43), sofa2, bevel=0.07, bake=256)
box("sofa_arm2", (0.9, 0.62, 0.26), (4.15, 0.55, 2.97), sofa2, bevel=0.07, bake=256)
# little wooden stool for the plant, left of the sofa
box("stool", (0.46, 0.09, 0.46), (4.3, 0.42, 0.0), mat("stoolm", hexc("5d4a38"), 0.8), bevel=0.02, bake=128)
for li, (lx, lz) in enumerate([(4.14, -0.16), (4.46, -0.16), (4.14, 0.16), (4.46, 0.16)]):
    box(f"stool_leg{li}", (0.05, 0.38, 0.05), (lx, 0.19, lz), mat(f"stool_l{li}", hexc("4a3b2d"), 0.8), bevel=0.008, bake=64)

# pink donut pouf against the left wall, like the reference
bpy.ops.mesh.primitive_torus_add(major_radius=0.46, minor_radius=0.22, major_segments=36, minor_segments=18)
pouf = bpy.context.object
pouf.name = "pouf"
pouf.scale = (1, 1, 0.75)
pouf.location = T(-3.55, 0.17, 0.55)
pouf.data.materials.append(col_bean)
bpy.ops.object.shade_smooth()
BAKE.append((pouf, 384))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, segments=20, ring_count=14)
pc = bpy.context.object
pc.name = "pouf_core"
pc.scale = (1, 1, 0.55)
pc.location = T(-3.55, 0.14, 0.55)
pc.data.materials.append(col_bean2)
bpy.ops.object.shade_smooth()
BAKE.append((pc, 192))

# ---------------------------------------------------------------- lighting
world = bpy.data.worlds.new("day")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (*hexc("bcd3ee"), 1)
bg.inputs["Strength"].default_value = 1.05

sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 4.6
sun.color = hexc("fff0d8")
sun.angle = math.radians(3)
sun_ob = bpy.data.objects.new("sun", sun)
bpy.context.collection.objects.link(sun_ob)
# daylight sun raking through the window
d = (-2.0, 7.0, -3.2)
length = math.sqrt(sum(c * c for c in d))
sun_ob.rotation_euler = (math.acos(-d[2] / length), 0, math.atan2(-d[0], d[1]))

# bright sky fill through the window
area = bpy.data.lights.new("window_fill", "AREA")
area.energy = 330
area.color = hexc("eaf2fd")
area.size = 3.4
area.size_y = 2.2
area_ob = bpy.data.objects.new("window_fill", area)
bpy.context.collection.objects.link(area_ob)
area_ob.location = T(0.6, 2.78, -4.3)
area_ob.rotation_euler = (math.radians(-90), 0, 0)  # face +y blender = into room

# ---------------------------------------------------------------- bake
def bake_object(ob, size):
    img = bpy.data.images.new(f"bk_{ob.name}", size, size, alpha=False)
    for slot in ob.material_slots:
        m = slot.material
        node = m.node_tree.nodes.new("ShaderNodeTexImage")
        node.image = img
        m.node_tree.nodes.active = node
        node.select = True
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR", "DIRECT", "INDIRECT"}, margin=4)
    # replace materials with a single baked-unlit-ish material
    baked = bpy.data.materials.new(f"baked_{ob.name}")
    baked.use_nodes = True
    b = baked.node_tree.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 1.0
    tex = baked.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    baked.node_tree.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    ob.data.materials.clear()
    ob.data.materials.append(baked)


for i, (ob, size) in enumerate(BAKE):
    print(f"[bake {i + 1}/{len(BAKE)}] {ob.name} @{size}", flush=True)
    bake_object(ob, 128 if FAST else size)

# ---------------------------------------------------------------- export
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
for ob in list(bpy.context.selected_objects):
    if ob.type == "LIGHT":
        ob.select_set(False)
bpy.ops.export_scene.gltf(filepath=os.path.abspath(OUT), export_format="GLB", use_selection=True, export_apply=True, export_image_format="JPEG", export_jpeg_quality=88)
print("EXPORTED", os.path.abspath(OUT), flush=True)
