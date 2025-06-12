const Group = require("../../models/roles/group_roles");

const populateChildren = async (group) => {
  await Group.populate(group, {
    path: "children",
    select: "name users children userPermissions description",
    populate: [
      { path: "users", select: "username email" },
      { path: "parent", select: "name" },
    ],
  });

  for (let child of group.children) {
    await populateChildren(child);
  }
};

const get_group_by_id = async (req, res) => {
  //Find the group by ID
  const groupId = req.query.groupId;
  try {
    const group = await Group.findById(groupId)
      .populate("users", "username email userPermissions description")
      .populate("parent", "name");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Populate children recursively
    await populateChildren(group);

    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Internal server error" });
  }

  // try {
  //   const group = await Group.find()
  //     .populate('users', 'username email userPermissions description')
  //     .populate('parent', 'name');

  //   for (let group of groups) {
  //     await populateChildren(group);
  //   }
  //   res.status(200).json(groups);
  // } catch (error) {
  //   console.error('Error fetching groups:', error);
  //   res.status(500).json({ message: 'Internal server error' });
  // }
};

module.exports = get_group_by_id;
