{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          # START USER CONFIG
          # Or replace with and `services.openvscode-server.connectionToken = "MYSUPERSECRETTOKEN";` and put /?tkn=MYSUPERSECRETTOKEN in the address bar
          services.openvscode-server.withoutConnectionToken = true;

          networking.hostName = "vscode-server";
          nixpkgs.hostPlatform = "x86_64-linux";
          system.stateVersion = "25.11";
          # END USER CONFIG

          services.openvscode-server.enable = true;
          services.openvscode-server.host = "0.0.0.0";

          networking.firewall.allowedTCPPorts = [ 3000 ];
        }
      ];
    };
  };
}
