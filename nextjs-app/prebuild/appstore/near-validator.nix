{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    near-validator.url = "github:Openmesh-Network/near-validator";
    nixpkgs.follows = "near-validator/nixpkgs";
  };

  nixConfig = {
    extra-substituters = [
      "https://openmesh.cachix.org"
    ];
    extra-trusted-public-keys = [
      "openmesh.cachix.org-1:du4NDeMWxcX8T5GddfuD0s/Tosl3+6b+T2+CLKHgXvQ="
    ];
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        inputs.near-validator.nixosModules.default
        (args: {
          # START USER CONFIG
          services.near-validator.pool.id = "openmesh";
          services.near-validator.pool.version = "pool";
          services.near-validator.pinger.enable = false;
          # END USER CONFIG

          services.near-validator.enable = true;

          networking.firewall.allowedTCPPorts = [
            3030
            24567
          ];
        })
      ];
    };
  };
}
