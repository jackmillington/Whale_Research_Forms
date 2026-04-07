(function () {
  // Shared option lists and the central form definitions live here.
  const yesNoOptions = ["Yes", "No"];
  const compassOptions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const conditionOptions = ["raw", "healing", "new", "bleeding", "severe"];
  const scarOptions = ["Dorsal", "Alongflank", "Boat Strike", "Sunburn", "Cookie cutter"];
  const vesselOptions = ["SOM", "KAI", "MULG", "RIB", "OTHER"];

  window.WHALE_FORMS = [
    {
      id: "mugging-study",
      title: "Mugging Study",
      file: "mugging-study.html",
      description: "Trip details, pod counts, repeatable approach cards, and associated species counts.",
      workbookSheet: "Mugging Study",
      sections: [
        {
          title: "Trip Information",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 3, itemLabel: "Researcher" }, helper: "Must allow adding up to 3 researchers." },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "newborn_in_pod", label: "Newborn in the pod?", type: "select", required: "Y", options: yesNoOptions }
          ]
        },
        {
          title: "Pod Details",
          fields: [
            { key: "num_adults", label: "Num of Adults", type: "number", required: "Y", min: 0, step: 1, helper: "Workbook note: adults is 12m+; juvenile note remains unresolved in the source workbook." },
            { key: "num_juveniles", label: "Num of Juveniles", type: "number", required: "Y", min: 0, step: 1 },
            { key: "mum_calf", label: "Mum & Calf?", type: "select", required: "Y", options: yesNoOptions },
            { key: "mum_calf_escort", label: "Mum/Calf/Escort", type: "select", required: "Y", options: yesNoOptions },
            { key: "num_escorts", label: "Num of Escorts", type: "number", required: "C", min: 0, step: 1, dependsOn: { field: "mum_calf_escort", equals: "Yes" }, helper: "Only shown when Mum/Calf/Escort is Yes." },
            { key: "num_animals", label: "Num of Animals", type: "number", required: "Y", min: 0, step: 1 },
            { key: "initial_behaviour", label: "Initial Behaviour before Approach", type: "select", required: "Y", options: ["Travel", "Mill", "Rest", "Swim by", "Surface active", "Mugging other boat", "Other"] },
            { key: "initial_behaviour_other", label: "Other", type: "text", required: "C", dependsOn: { field: "initial_behaviour", includes: "Other" }, helper: "Only shown when Other is selected above." },
            { key: "num_other_boats", label: "Num of other boats", type: "number", required: "Y", min: 0, step: 1 },
            { key: "engines_state", label: "Engines off or neutral", type: "radio", required: "Y", options: ["Off", "Neutral"], helper: "Rendered as an exclusive choice because the workbook says only 1 box may be checked." },
            { key: "depth", label: "Depth (meters)", type: "number", required: "Y", min: 0, step: "any", unit: "meters" },
            { key: "gps", label: "GPS", type: "gps", required: "Y", latitudeKey: "gps_latitude", longitudeKey: "gps_longitude" },
            { key: "gps_track_name", label: "GPS Track Name", type: "text", required: "Y" }
          ]
        },
        {
          title: "Approaches",
          description: "Approach 1 is shown by default. Additional approach cards can be added and removed.",
          repeatable: {
            key: "approaches",
            itemLabel: "Approach",
            min: 1,
            addLabel: "Add Another Approach",
            fields: [
              { key: "start_time", label: "Start Time", type: "time", required: "Y" },
              { key: "end_time", label: "End Time", type: "time", required: "Y" },
              { key: "who_left_first", label: "Who Left First?", type: "radio", required: "Y", options: ["Us", "Them"], helper: "Rendered as an exclusive choice because the workbook says only 1 box may be checked." },
              { key: "where_mugged", label: "Where did they mug?", type: "select", required: "Y", options: ["Stern", "Side", "Bow", "Under"] },
              { key: "intensity", label: "Intensity", type: "select", required: "Y", options: ["Lo", "Med", "High"] },
              { key: "approach_description", label: "Approach description", type: "textarea", required: "Y", maxLength: 1000, helper: "Room for 200 words, 1000 characters." }
            ]
          }
        },
        {
          title: "Media and Associated Species",
          fields: [
            { key: "photos", label: "Photos", type: "text", required: "Y", placeholder: "337-442 NELLIE" },
            { key: "videos", label: "Videos", type: "number", required: "Y", min: 0, step: 1 },
            { key: "presence_bnd", label: "Presence of BND", type: "select", required: "Y", options: yesNoOptions },
            { key: "num_bnd", label: "Num of BND", type: "number", required: "C", min: 0, step: 1, dependsOn: { field: "presence_bnd", equals: "Yes" } },
            { key: "presence_cd", label: "Presence of CD", type: "select", required: "Y", options: yesNoOptions },
            { key: "num_cd", label: "Num of CD", type: "number", required: "C", min: 0, step: 1, dependsOn: { field: "presence_cd", equals: "Yes" } },
            { key: "presence_birds", label: "Presence of Birds", type: "select", required: "Y", options: yesNoOptions },
            { key: "num_birds", label: "Num of birds", type: "number", required: "C", min: 0, step: 1, dependsOn: { field: "presence_birds", equals: "Yes" } },
            { key: "form_filled_by", label: "Form filled by", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Form filled by" }, helper: "Allow up to 2 names." },
            { key: "checked_by", label: "Checked by", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Checked by" }, helper: "Allow up to 2 names." }
          ]
        }
      ]
    },
    {
      id: "other-species",
      title: "Other Species",
      file: "other-species.html",
      description: "Non-target species observations with conditional species detail and GPS start/end fields.",
      workbookSheet: "Other Species",
      sections: [
        {
          title: "Trip Information",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Researcher" }, helper: "Must allow up to 2 inputs." },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" }
          ]
        },
        {
          title: "Observation",
          fields: [
            { key: "species", label: "Species", type: "select", required: "Y", options: ["Bottlenose Dolphins", "Sea Turtle", "Common Dolphins", "Hammerhead Shar", "Indo Pacific Humpback Dolphin", "Minke Whale", "Orca", "Southern Right Whale", "Other"] },
            { key: "species_other", label: "Other", type: "text", required: "C", dependsOn: { field: "species", includes: "Other" }, helper: "Only shown when Species is Other." },
            { key: "sight_time_start", label: "Sight Time Start", type: "time", required: "Y" },
            { key: "sight_time_end", label: "Sight Time End", type: "time", required: "Y" },
            { key: "num_in_group", label: "Num in Group", type: "number", required: "Y", min: 0, step: 1 },
            { key: "start_gps", label: "Start GPS", type: "gps", required: "Y", latitudeKey: "start_gps_latitude", longitudeKey: "start_gps_longitude" },
            { key: "end_gps", label: "End GPS", type: "gps", required: "Y", latitudeKey: "end_gps_latitude", longitudeKey: "end_gps_longitude" },
            { key: "accompanying_whales", label: "Accompanying Whales?", type: "select", required: "Y", options: yesNoOptions },
            { key: "mixed_group_of_dolphins", label: "Mixed Group of Dolphins", type: "radio", required: "Y", options: ["Single Species", "Mixed group"], helper: "Rendered as an exclusive choice because the workbook says only 1 box may be checked." },
            { key: "comments", label: "Comments", type: "textarea", required: "Y", maxLength: 600, helper: "Up to 100 words/numbers, 600 character limit." }
          ]
        }
      ]
    },
    {
      id: "newborn",
      title: "Newborn",
      file: "newborn.html",
      description: "Environmental conditions plus newborn observation details, scar-condition mapping, and associated species comments.",
      workbookSheet: "Newborn",
      sections: [
        {
          title: "Trip Information",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Researcher" }, helper: "Must allow up to 2 names." },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "weather", label: "Weather", type: "select", required: "Y", options: ["sun", "cloud", "rain"] },
            { key: "seas", label: "Seas", type: "select", required: "Y", options: ["Flat", "Small", "Med", "Rough"] },
            { key: "wind_speed", label: "Wind Speed (knots)", type: "number", required: "Y", min: 0, step: 1, unit: "knots" },
            { key: "wind_direction", label: "Wind Direction", type: "select", required: "Y", options: compassOptions, helper: "Assumption: compass-direction picker." },
            { key: "newborn_in_pod", label: "Newborn in Pod", type: "select", required: "Y", options: yesNoOptions }
          ]
        },
        {
          title: "Newborn Observation",
          description: "The MVP shows this section only when Newborn in Pod is selected.",
          dependsOn: { field: "newborn_in_pod", equals: "Yes" },
          fields: [
            { key: "sight_time_start", label: "Sight Time Start", type: "time", required: "Y" },
            { key: "dorsal_fin", label: "Dorsal Fin", type: "select", required: "Y", options: ["VRY TILT", "TILT", "ERECT"] },
            { key: "colour", label: "Colour", type: "select", required: "Y", options: ["Pale", "Med", "Dark"] },
            { key: "swim_skill", label: "Swim Skill", type: "select", required: "Y", options: ["Bad", "Good"] },
            { key: "start_depth", label: "Start Depth (meters)", type: "number", required: "Y", min: 0, step: "any", unit: "meters" },
            { key: "end_depth", label: "End Depth (meters)", type: "number", required: "Y", min: 0, step: "any", unit: "meters" },
            { key: "start_gps", label: "Start GPS", type: "gps", required: "Y", latitudeKey: "start_gps_latitude", longitudeKey: "start_gps_longitude" },
            { key: "end_gps", label: "End GPS", type: "gps", required: "Y", latitudeKey: "end_gps_latitude", longitudeKey: "end_gps_longitude" },
            { key: "calf_size_vs_mum", label: "Calf Size vs Mum", type: "select", required: "Y", options: ["less1/3", "1/3", "BIG"] },
            { key: "rostrum_out_surfacing", label: "Rostrum Out Surfacing", type: "select", required: "Y", options: yesNoOptions },
            { key: "calf_swim_position", label: "Calf Swim Position", type: "checkbox-group", required: "Y", options: ["Tuck", "Near", "Indep"], helper: "Workbook marks this as multiple choice." },
            { key: "number_of_escorts", label: "Number of Escorts", type: "number", required: "Y", min: 0, step: 1, defaultValue: 0, helper: "Default to 0." },
            { key: "calf_scars", label: "Calf Scars?", type: "checkbox-group", required: "N", options: scarOptions },
            { key: "calf_scars_condition", label: "Condition?", type: "details-select", required: "C", sourceField: "calf_scars", options: conditionOptions, helper: "One condition selector is shown for each selected scar." },
            { key: "sight_end_time", label: "Sight End Time", type: "time", required: "Y" }
          ]
        },
        {
          title: "Associated Species and Sign-off",
          fields: [
            { key: "other_species_with_pod", label: "Any Other Species with Pod", type: "checkbox-group", required: "C", options: ["BND", "CD", "SHARK", "BIRDS", "TURTLE"], helper: "If left blank it is assumed there were no other species with the pod." },
            { key: "please_comment", label: "Please Comment", type: "text", required: "C", dependsOn: { field: "other_species_with_pod", hasAny: true }, helper: "Only shown when at least one other species is selected." },
            { key: "gps_track_name", label: "GPS Track Name", type: "text", required: "Y" },
            { key: "comments", label: "Comments", type: "textarea", required: "Y", maxLength: 500, helper: "Must hold 75 words/numbers, 500 character limit." },
            { key: "other_boats", label: "Other Boats?", type: "checkbox-group", required: "N", options: ["rec/fish", "jetskis", "big boats"] },
            { key: "other_boats_amount", label: "Amount", type: "details-number", required: "C", sourceField: "other_boats", min: 0, step: 1, helper: "Shown for each selected other boat option." },
            { key: "direction_of_travel", label: "Direction of Travel", type: "select", required: "Y", options: ["North", "South", "None"] },
            { key: "form_filled_by", label: "Form Filled By", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Form Filled By" }, helper: "Must allow up to 2 names." },
            { key: "checked_by", label: "Checked By", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Checked By" }, helper: "Must allow up to 2 names." }
          ]
        }
      ]
    },
    {
      id: "research-logbook",
      title: "Research Logbook",
      file: "research-logbook.html",
      description: "Compact trip log with sightings notes and photo references.",
      workbookSheet: "Research Logbook",
      sections: [
        {
          title: "Logbook Entry",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Researcher" }, helper: "Must allow up to 2 names." },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "sightings", label: "Sightings", type: "textarea", required: "Y" },
            { key: "photos", label: "Photos", type: "text", required: "Y", placeholder: "337-442 NELLIE" }
          ]
        }
      ]
    },
    {
      id: "cos-study",
      title: "COS Study",
      file: "cos-study.html",
      description: "Long-form Calf of Season sheet with behavior groups, scar conditions, and conditional detail fields.",
      workbookSheet: "COS Study",
      sections: [
        {
          title: "Trip Information",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Researcher" }, helper: "Allow 1 or 2 names." },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "newborn", label: "Newborn?", type: "select", required: "Y", options: yesNoOptions },
            { key: "calf_of_season", label: "Calf of Season?", type: "select", required: "Y", options: yesNoOptions }
          ]
        },
        {
          title: "COS Observation",
          fields: [
            { key: "sight_start_time", label: "Sight Start time", type: "time", required: "Y" },
            { key: "dorsal_fin", label: "Dorsal Fin", type: "select", required: "Y", options: ["VRY TILT", "TILT", "ERECT"] },
            { key: "colour", label: "Colour", type: "select", required: "Y", options: ["Pale", "Medium", "Dark"] },
            { key: "calf_size_vs_mum", label: "Calf Size vs Mum", type: "select", required: "Y", options: [">1/3", "1/3", "BIG"] },
            { key: "travel_speed", label: "Travel Speed", type: "select", required: "Y", options: ["Slow", "Medium", "Fast"] },
            { key: "direction_of_travel", label: "Direction of Travel", type: "select", required: "Y", options: ["North", "South", "None"] },
            { key: "head_out_surfacing", label: "Head Out Surfacing?", type: "select", required: "Y", options: yesNoOptions },
            { key: "calf_swim_position", label: "Calf Swim Position", type: "checkbox-group", required: "Y", options: ["Tuck", "Near", "Ahead", "Indep"] },
            { key: "number_of_escorts", label: "Number of Escorts?", type: "number", required: "Y", min: 0, step: 1, defaultValue: 0, helper: "Default is 0." },
            { key: "calf_scars", label: "Calf Scars?", type: "checkbox-group", required: "N", options: scarOptions },
            { key: "condition", label: "Condition?", type: "details-select", required: "C", sourceField: "calf_scars", options: conditionOptions, helper: "Shown per selected scar." },
            { key: "dive_times", label: "Dive Times?", type: "checkbox-group", required: "C", options: ["<1 min", "<3 min", "<5 min", ">5 min", ">10 min"], helper: "Workbook notes 1 or 2 selections." },
            { key: "start_gps", label: "Start GPS", type: "gps", required: "Y", latitudeKey: "start_gps_latitude", longitudeKey: "start_gps_longitude" },
            { key: "start_depth", label: "Start Depth (meters)", type: "number", required: "Y", min: 0, step: "any", unit: "meters" },
            { key: "calf_mode", label: "Calf Mode", type: "checkbox-group", required: "Y", options: ["Play", "Swim training", "Travelling"] }
          ]
        },
        {
          title: "Calf Behaviour Section",
          description: "Can choose multiple or none for all sections, as per the workbook note.",
          fields: [
            { key: "learn_to_breach", label: "Learn to Breach", type: "checkbox-group", required: "N", options: ["Phase 1", "Phase 2", "Phase 3"], helper: "Phase descriptions are shortened in the label, with the workbook wording preserved in meaning." },
            { key: "learn_pec_behaviours", label: "Learn pec behaviours", type: "checkbox-group", required: "N", options: ["Pec slap", "Belly-up slap", "Pec wave"] },
            { key: "learn_tail_behaviours", label: "Learn tail behaviours", type: "checkbox-group", required: "N", options: ["Tail slap", "Tail throw", "Tail wave", "Tail swish", "Peduncle"] },
            { key: "diving", label: "Diving", type: "checkbox-group", required: "N", options: ["No fluke", "Fluke down", "Fluke up"] },
            { key: "other_behaviour", label: "Other", type: "checkbox-group", required: "N", options: ["Rolling", "Head Lunge", "Chin Slap"] }
          ]
        },
        {
          title: "Group Context and Sign-off",
          fields: [
            { key: "mum_cos_pairs", label: "Was Mum and COS alone or with other mum/COS pairs?", type: "select", required: "Y", options: ["Alone", "with 1 mum/ cos pair", "with 2 mum/cos pairs", "with 3 mum/cos pairs"] },
            { key: "swim_skill", label: "Swim Skill", type: "select", required: "Y", options: ["Bad", "Good", "Advanced"] },
            { key: "sight_end_time", label: "Sight End Time", type: "time", required: "Y" },
            { key: "comments", label: "Comments", type: "textarea", required: "N", maxLength: 800, helper: "Allow for 100 words/numbers, 800 characters." },
            { key: "other_boats", label: "Other Boats?", type: "checkbox-group", required: "N", options: ["rec/fish", "jetskis", "big boats"] },
            { key: "other_boats_amount", label: "Amount", type: "details-number", required: "C", sourceField: "other_boats", min: 0, step: 1, helper: "Shown for each selected other boat option." },
            { key: "other_species", label: "Other Species", type: "checkbox-group", required: "N", options: ["BND", "CD", "IPHD", "Turtle", "Shark"] },
            { key: "other_species_comment", label: "Comment (on other species)", type: "text", required: "C", dependsOn: { field: "other_species", hasAny: true }, helper: "Shown when at least one other species is selected." },
            { key: "photos", label: "Photos", type: "text", required: "N", placeholder: "337-442 NELLIE" },
            { key: "end_gps", label: "End GPS", type: "gps", required: "Y", latitudeKey: "end_gps_latitude", longitudeKey: "end_gps_longitude" },
            { key: "depth", label: "Depth (meters)", type: "number", required: "Y", min: 0, step: "any", unit: "meters" },
            { key: "gps_track_name", label: "GPS Track Name", type: "text", required: "Y" },
            { key: "data_recorder", label: "Data Recorder", type: "text", required: "Y" },
            { key: "data_checker", label: "Data Checker", type: "text", required: "Y" }
          ]
        }
      ]
    },
    {
      id: "two-minute-study",
      title: "Two Minute Study",
      file: "two-minute-study.html",
      description: "Trip setup plus repeatable timed observation records for the two-minute study workflow.",
      workbookSheet: "Two Minute Study",
      sections: [
        {
          title: "Trip information",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "researchers", label: "Researchers", type: "text", required: "Y", repeatable: { min: 1, max: 3, itemLabel: "Researcher" } },
            { key: "start_time", label: "Start time", type: "time", required: "Y" },
            { key: "end_time", label: "End time", type: "time", required: "Y" },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "tour_time", label: "Tour time", type: "time", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "bss", label: "BSS", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." }
          ]
        },
        {
          title: "Environmental Conditions",
          fields: [
            { key: "wind_speed_direction", label: "Wind Speed / Direction", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "weather", label: "Weather", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "tide", label: "Tide", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "calf_position", label: "Calf position", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "calf_activity", label: "Calf activity", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "initial_behaviour", label: "Initial behaviour", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "position_to_mum", label: "Position To Mum", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "position_to_boat", label: "Position To Boat", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "calf_behaviour", label: "Calf behaviour", type: "textarea", required: "C", helper: "Workbook lists this as a multi-select checkbox but does not provide the option set." },
            { key: "calf_touch", label: "Calf touch", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
            { key: "observation_time", label: "Observation time", type: "time", required: "Y" }
          ]
        },
        {
          title: "Observation recordings",
          repeatable: {
            key: "observation_records",
            itemLabel: "Observation record",
            min: 1,
            addLabel: "Add Observation Record",
            fields: [
              { key: "position", label: "Position", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." },
              { key: "activity", label: "Activity", type: "text", required: "Y", helper: "Workbook lists this as a dropdown but does not provide options." },
              { key: "mum_position", label: "Mum position", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
              { key: "close_to_boat", label: "Close to boat", type: "select", required: "C", options: yesNoOptions },
              { key: "behaviours", label: "Behaviours", type: "textarea", required: "C", helper: "Workbook lists this as a multi-select checkbox but does not provide options." },
              { key: "touch", label: "Touch", type: "text", required: "C", helper: "Workbook lists this as a dropdown but does not provide options." },
              { key: "observation_interval", label: "Observation Interval", type: "number", required: "Y", min: 2, max: 2, step: 1, defaultValue: 2, readOnly: true, helper: "Locked to the workbook default of 2 minute." },
              { key: "gps_location", label: "GPS Location", type: "text", required: "C", helper: "Assumption: free-text GPS capture field for MVP." },
              { key: "photos", label: "Photos", type: "text", required: "N", placeholder: "337-442 NELLIE" }
            ]
          }
        }
      ]
    },
    {
      id: "dolphing-sightings-w-whales",
      title: "Dolphing sightings w whales",
      file: "dolphing-sightings-w-whales.html",
      description: "Compact mixed-species support sheet with free-text photo references and details.",
      workbookSheet: "Dolphing sightings w whales",
      sections: [
        {
          title: "Sighting Details",
          fields: [
            { key: "date", label: "Date", type: "date", required: "Y" },
            { key: "skipper", label: "Skipper", type: "text", required: "Y" },
            { key: "researcher", label: "Researcher", type: "text", required: "Y", repeatable: { min: 1, max: 2, itemLabel: "Researcher" } },
            { key: "tour_time", label: "Tour Time", type: "time", required: "Y" },
            { key: "vessel", label: "Vessel", type: "select", required: "Y", options: vesselOptions },
            { key: "photos", label: "Photos", type: "text", required: "Y", placeholder: "337-442 NELLIE" },
            { key: "details", label: "Details", type: "textarea", required: "Y", maxLength: 800, helper: "100 words/numbers, 800 characters." }
          ]
        }
      ]
    }
  ];
})();
